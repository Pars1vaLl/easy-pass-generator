import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../server";
import { TRPCError } from "@trpc/server";
import { encryptWorkflowConfig, decryptWorkflowConfig } from "@/lib/crypto";
import { WorkflowCategory } from "@prisma/client";

// ─── Shared model config validation ──────────────────────────────────────────

const aiModelSchema = z.enum([
  "nanobanana-v2",
  "seedance-image-v1",
  "gpt-image-1",
  "sora-2",
  "kling-ai-v1.5",
  "seedance-video-v1",
  "veo-3.1",
]);

const userInputFieldSchema = z.object({
  name: z.string().min(1).regex(/^\w+$/, "Field name must be alphanumeric"),
  label: z.string().min(1),
  type: z.enum(["text", "textarea", "select", "slider", "toggle"]),
  placeholder: z.string().optional(),
  required: z.boolean(),
  maxLength: z.number().int().positive().optional(),
  options: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  default: z.unknown().optional(),
});

const promptTemplateSchema = z.union([
  // New: template string with {{variable}} placeholders
  z.object({
    template: z.string().min(1, "Template string is required"),
    system: z.string().optional(),
    negativePrompt: z.string().optional(),
  }),
  // Legacy: prefix / suffix
  z.object({
    prefix: z.string(),
    suffix: z.string(),
    system: z.string().optional(),
    negativePrompt: z.string().optional(),
  }),
]);

const modelParametersSchema = z
  .object({
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    aspectRatio: z.string().optional(),
    steps: z.number().int().positive().optional(),
    cfgScale: z.number().positive().optional(),
    seed: z.union([z.number().int(), z.literal("random")]).optional(),
    duration: z.number().positive().optional(),
    fps: z.number().int().positive().optional(),
    motionStrength: z.number().optional(),
    style: z.string().optional(),
    quality: z.enum(["draft", "standard", "hd"]).optional(),
  })
  .passthrough(); // allow extra keys for provider-specific params

const workflowConfigSchema = z.object({
  mediaType: z.enum(["image", "video"]),
  model: z.object({
    primary: aiModelSchema,
    fallback: aiModelSchema.optional(),
  }),
  promptTemplate: promptTemplateSchema,
  parameters: modelParametersSchema,
  userInputSchema: z.array(userInputFieldSchema).default([]),
  creditCost: z.number().int().positive().optional(),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const workflowsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.nativeEnum(WorkflowCategory).optional(),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        featuredOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        isActive: true,
        ...(input.category && { category: input.category }),
        ...(input.featuredOnly && { isFeatured: true }),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            { tags: { has: input.search } },
          ],
        }),
      };

      const workflows = await ctx.db.workflow.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          category: true,
          coverImageUrl: true,
          previewUrls: true,
          tags: true,
          creditCost: true,
          isFeatured: true,
        },
      });

      return {
        workflows: workflows.slice(0, input.limit),
        nextCursor:
          workflows.length > input.limit ? workflows[input.limit].id : undefined,
      };
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await ctx.db.workflow.findUnique({
        where: { slug: input.slug, isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          category: true,
          coverImageUrl: true,
          previewUrls: true,
          tags: true,
          creditCost: true,
          isFeatured: true,
        },
      });

      if (!workflow) throw new TRPCError({ code: "NOT_FOUND" });

      const raw = await ctx.db.workflow.findUnique({
        where: { slug: input.slug },
        select: { modelConfig: true },
      });

      let userInputSchema: unknown[] = [];
      if (raw?.modelConfig) {
        try {
          const config = decryptWorkflowConfig<{ userInputSchema?: unknown[] }>(
            raw.modelConfig as string
          );
          userInputSchema = config.userInputSchema ?? [];
        } catch {
          const config = raw.modelConfig as { userInputSchema?: unknown[] };
          userInputSchema = config.userInputSchema ?? [];
        }
      }

      return { ...workflow, userInputSchema };
    }),

  // ─── Admin procedures ─────────────────────────────────────────────────────

  adminList: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.workflow.findMany({ orderBy: { createdAt: "desc" } });
  }),

  adminCreate: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
        description: z.string().min(1),
        category: z.nativeEnum(WorkflowCategory),
        coverImageUrl: z.string().url(),
        previewUrls: z.array(z.string().url()).max(4).default([]),
        tags: z.array(z.string()).default([]),
        creditCost: z.number().int().min(1),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
        // Validated against the schema; stored encrypted
        modelConfig: workflowConfigSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { modelConfig, ...rest } = input;

      // Override creditCost from modelConfig if explicitly set there
      const effectiveCreditCost = input.creditCost;

      const encryptedConfig = encryptWorkflowConfig(modelConfig);
      // Keep a plaintext copy of the prompt template for quick access without decryption
      const promptTemplate = "template" in modelConfig.promptTemplate
        ? { template: modelConfig.promptTemplate.template }
        : { prefix: modelConfig.promptTemplate.prefix, suffix: modelConfig.promptTemplate.suffix };

      return ctx.db.workflow.create({
        data: {
          ...rest,
          creditCost: effectiveCreditCost,
          modelConfig: encryptedConfig,
          promptTemplate,
        },
      });
    }),

  adminUpdate: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.nativeEnum(WorkflowCategory).optional(),
        coverImageUrl: z.string().url().optional(),
        previewUrls: z.array(z.string().url()).max(4).optional(),
        tags: z.array(z.string()).optional(),
        creditCost: z.number().int().min(1).optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        modelConfig: workflowConfigSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, modelConfig, ...rest } = input;

      let modelConfigUpdate: Record<string, unknown> = {};
      if (modelConfig) {
        const encryptedConfig = encryptWorkflowConfig(modelConfig);
        const promptTemplate = "template" in modelConfig.promptTemplate
          ? { template: modelConfig.promptTemplate.template }
          : { prefix: modelConfig.promptTemplate.prefix, suffix: modelConfig.promptTemplate.suffix };

        modelConfigUpdate = { modelConfig: encryptedConfig, promptTemplate };
      }

      return ctx.db.workflow.update({
        where: { id },
        data: { ...rest, ...modelConfigUpdate },
      });
    }),

  adminDelete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.workflow.delete({ where: { id: input.id } });
      return { success: true };
    }),

  /** Validate a modelConfig object without saving — useful for the admin UI */
  adminValidateConfig: adminProcedure
    .input(z.object({ config: z.record(z.string(), z.unknown()) }))
    .mutation(({ input }) => {
      const result = workflowConfigSchema.safeParse(input.config);
      if (!result.success) {
        return { valid: false, errors: result.error.flatten().fieldErrors };
      }
      // Return which template variables are used for docs
      const pt = result.data.promptTemplate;
      const variables: string[] = [];
      if ("template" in pt) {
        const matches = [...pt.template.matchAll(/\{\{(\w+)\}\}/g)];
        variables.push(...new Set(matches.map((m) => m[1])));
      }
      return { valid: true, errors: null, variables };
    }),
});
