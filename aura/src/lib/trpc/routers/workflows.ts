import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../server";
import { TRPCError } from "@trpc/server";
import { encryptWorkflowConfig, decryptWorkflowConfig } from "@/lib/crypto";
import { WorkflowCategory } from "@prisma/client";

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
          // Never expose modelConfig or promptTemplate
        },
      });

      return {
        workflows: workflows.slice(0, input.limit),
        nextCursor:
          workflows.length > input.limit
            ? workflows[input.limit].id
            : undefined,
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
          promptTemplate: false, // Never expose
          modelConfig: false,    // Never expose
        },
      });

      if (!workflow) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Get user input schema from modelConfig (admin-only field)
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
          // Fallback to raw JSON if not encrypted
          const config = raw.modelConfig as { userInputSchema?: unknown[] };
          userInputSchema = config.userInputSchema ?? [];
        }
      }

      return { ...workflow, userInputSchema };
    }),

  // Admin procedures
  adminList: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.workflow.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  adminCreate: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
        description: z.string(),
        category: z.nativeEnum(WorkflowCategory),
        coverImageUrl: z.string().url(),
        previewUrls: z.array(z.string()).max(4),
        tags: z.array(z.string()),
        creditCost: z.number().min(1),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
        modelConfig: z.record(z.string(), z.unknown()),
        promptTemplate: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const encryptedConfig = encryptWorkflowConfig(input.modelConfig);
      const encryptedPrompt = encryptWorkflowConfig(input.promptTemplate);

      return ctx.db.workflow.create({
        data: {
          ...input,
          modelConfig: encryptedConfig,
          promptTemplate: encryptedPrompt,
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
        previewUrls: z.array(z.string()).max(4).optional(),
        tags: z.array(z.string()).optional(),
        creditCost: z.number().min(1).optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        modelConfig: z.record(z.string(), z.unknown()).optional(),
        promptTemplate: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, modelConfig, promptTemplate, ...rest } = input;

      return ctx.db.workflow.update({
        where: { id },
        data: {
          ...rest,
          ...(modelConfig && { modelConfig: encryptWorkflowConfig(modelConfig) }),
          ...(promptTemplate && { promptTemplate: encryptWorkflowConfig(promptTemplate) }),
        },
      });
    }),

  adminDelete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.workflow.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
