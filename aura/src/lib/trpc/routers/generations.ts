import { z } from "zod";
import { router, protectedProcedure, publicProcedure, adminProcedure } from "../server";
import { TRPCError } from "@trpc/server";
import { moderatePrompt } from "@/lib/moderation";
import { checkGenerationRateLimit } from "@/lib/rate-limit";
import { signUrl } from "@/lib/storage";
import { auditLog } from "@/lib/audit";
import { Plan, GenerationStatus, MediaType } from "@prisma/client";
import { randomBytes } from "crypto";
import { decryptWorkflowConfig } from "@/lib/crypto";
import type { WorkflowConfig } from "@/types/workflow";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validate user-submitted params against the workflow's userInputSchema.
 * Returns cleaned params with defaults applied.
 * Throws TRPCError if a required field is missing or has an invalid type.
 */
function validateParams(
  params: Record<string, unknown>,
  schema: WorkflowConfig["userInputSchema"]
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const field of schema) {
    const raw = params[field.name];

    if (raw === undefined || raw === null || raw === "") {
      if (field.required) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Field "${field.label}" is required`,
        });
      }
      if (field.default !== undefined) {
        cleaned[field.name] = field.default;
      }
      continue;
    }

    // Type-check & coerce
    switch (field.type) {
      case "slider": {
        const num = Number(raw);
        if (isNaN(num)) throw new TRPCError({ code: "BAD_REQUEST", message: `Field "${field.label}" must be a number` });
        const min = field.min ?? -Infinity;
        const max = field.max ?? Infinity;
        if (num < min || num > max) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Field "${field.label}" must be between ${min} and ${max}` });
        }
        cleaned[field.name] = num;
        break;
      }
      case "toggle":
        cleaned[field.name] = Boolean(raw);
        break;
      case "select": {
        const allowed = field.options?.map((o) => o.value) ?? [];
        if (allowed.length > 0 && !allowed.includes(String(raw))) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Invalid value for "${field.label}"` });
        }
        cleaned[field.name] = String(raw);
        break;
      }
      case "text":
      case "textarea": {
        const str = String(raw);
        if (field.maxLength && str.length > field.maxLength) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `"${field.label}" exceeds max length of ${field.maxLength}` });
        }
        cleaned[field.name] = str;
        break;
      }
      default:
        cleaned[field.name] = String(raw);
    }
  }

  return cleaned;
}

/** Sign output URLs with a 1-hour TTL (fire and forget errors). */
async function signOutputUrls(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map((u) => signUrl(u, 3600).catch(() => u)));
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const generationsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        workflowId: z.string().cuid(),
        userPrompt: z.string().min(1, "Prompt is required").max(500).trim(),
        params: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;

      const workflow = await ctx.db.workflow.findUnique({
        where: { id: input.workflowId, isActive: true },
        select: { id: true, creditCost: true, category: true, modelConfig: true },
      });

      if (!workflow) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });

      if (user.credits < workflow.creditCost) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient credits" });
      }

      await checkGenerationRateLimit(user.id, user.plan as Plan);
      await moderatePrompt(input.userPrompt, input.params ?? {});

      // Validate params against userInputSchema
      let cleanedParams: Record<string, unknown> = {};
      try {
        const config = decryptWorkflowConfig<WorkflowConfig>(workflow.modelConfig as string);
        if (config.userInputSchema?.length) {
          cleanedParams = validateParams(input.params ?? {}, config.userInputSchema);
        }
      } catch (err) {
        // If decrypt fails (plain JSON workflow), skip param validation
        if (err instanceof TRPCError) throw err;
        cleanedParams = input.params ?? {};
      }

      const mediaType = workflow.category.startsWith("VIDEO_") ? "VIDEO" : "IMAGE";

      const [, generation] = await ctx.db.$transaction([
        ctx.db.user.update({
          where: { id: user.id },
          data: { credits: { decrement: workflow.creditCost } },
        }),
        ctx.db.generation.create({
          data: {
            userId: user.id,
            workflowId: input.workflowId,
            userPrompt: input.userPrompt,
            params: cleanedParams,
            status: "PENDING",
            mediaType,
            creditsCost: workflow.creditCost,
          },
          select: { id: true },
        }),
      ]);

      // Async: save prompt to history + prune old entries
      void ctx.db.promptHistory
        .create({ data: { userId: user.id, prompt: input.userPrompt, workflowId: input.workflowId } })
        .then(() =>
          ctx.db.promptHistory
            .findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, skip: 50, select: { id: true } })
            .then((old) =>
              old.length > 0
                ? ctx.db.promptHistory.deleteMany({ where: { id: { in: old.map((r) => r.id) } } })
                : null
            )
        )
        .catch(() => null);

      // Enqueue job
      try {
        const { generationQueue } = await import("@/lib/queue");
        const job = await generationQueue.add("generate", { generationId: generation.id });
        await ctx.db.generation.update({
          where: { id: generation.id },
          data: { status: "QUEUED", jobId: job.id },
        });
      } catch (err) {
        console.error("Queue error:", err);
        // Generation stays PENDING; worker can be re-triggered later
      }

      void auditLog(user.id, "generation.created", {
        workflowId: input.workflowId,
        generationId: generation.id,
      });

      return { generationId: generation.id };
    }),

  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        status: z.nativeEnum(GenerationStatus).optional(),
        mediaType: z.nativeEnum(MediaType).optional(),
        workflowId: z.string().cuid().optional(),
        favoritesOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const generations = await ctx.db.generation.findMany({
        where: {
          userId: ctx.user.id,
          ...(input.status && { status: input.status }),
          ...(input.mediaType && { mediaType: input.mediaType }),
          ...(input.workflowId && { workflowId: input.workflowId }),
          ...(input.favoritesOnly && { isFavorite: true }),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        select: {
          id: true,
          status: true,
          outputUrls: true,
          thumbnailUrl: true,
          blurhash: true,
          isFavorite: true,
          shareToken: true,
          mediaType: true,
          userPrompt: true,
          createdAt: true,
          workflow: { select: { name: true, slug: true, category: true } },
        },
      });

      const withSignedUrls = await Promise.all(
        generations.map(async (g) => ({
          ...g,
          outputUrls: await signOutputUrls(g.outputUrls),
        }))
      );

      return {
        generations: withSignedUrls.slice(0, input.limit),
        nextCursor:
          withSignedUrls.length > input.limit ? withSignedUrls[input.limit].id : undefined,
      };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        include: {
          workflow: { select: { name: true, category: true, slug: true } },
        },
      });

      if (!generation) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        ...generation,
        outputUrls: await signOutputUrls(generation.outputUrls),
      };
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        select: { isFavorite: true },
      });

      if (!generation) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.generation.update({
        where: { id: input.id },
        data: { isFavorite: !generation.isFavorite },
        select: { isFavorite: true },
      });

      return { isFavorite: updated.isFavorite };
    }),

  createShareLink: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findFirst({
        where: { id: input.id, userId: ctx.user.id, status: "COMPLETED" },
        select: { shareToken: true },
      });

      if (!generation) throw new TRPCError({ code: "NOT_FOUND" });

      if (generation.shareToken) return { shareToken: generation.shareToken };

      const shareToken = randomBytes(20).toString("hex"); // 40-char hex = 160 bits
      await ctx.db.generation.update({ where: { id: input.id }, data: { shareToken } });
      return { shareToken };
    }),

  revokeShareLink: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.generation.updateMany({
        where: { id: input.id, userId: ctx.user.id },
        data: { shareToken: null },
      });
      return { success: true };
    }),

  getShared: publicProcedure
    .input(z.object({ token: z.string().regex(/^[0-9a-f]{40}$/i, "Invalid share token") }))
    .query(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findFirst({
        where: { shareToken: input.token, status: "COMPLETED" },
        select: {
          id: true,
          outputUrls: true,
          thumbnailUrl: true,
          mediaType: true,
          userPrompt: true,  // user's own input is fine to show
          createdAt: true,
          workflow: { select: { name: true, category: true } },
          user: { select: { name: true, avatarUrl: true } },
        },
      });

      if (!generation) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        ...generation,
        outputUrls: await signOutputUrls(generation.outputUrls),
      };
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findFirst({
        where: { id: input.id, userId: ctx.user.id, status: { in: ["PENDING", "QUEUED"] } },
        select: { id: true, creditsCost: true },
      });

      if (!generation) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.$transaction([
        ctx.db.generation.update({ where: { id: input.id }, data: { status: "CANCELLED" } }),
        ctx.db.user.update({
          where: { id: ctx.user.id },
          data: { credits: { increment: generation.creditsCost } },
        }),
      ]);

      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    // Single grouped query instead of 4 separate COUNTs
    const [grouped, favorites] = await Promise.all([
      ctx.db.generation.groupBy({
        by: ["status"],
        where: { userId: ctx.user.id },
        _count: { id: true },
      }),
      ctx.db.generation.count({ where: { userId: ctx.user.id, isFavorite: true } }),
    ]);

    const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count.id]));
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const completed = counts.COMPLETED ?? 0;

    return {
      total,
      completed,
      failed: counts.FAILED ?? 0,
      favorites,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }),

  retry: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findFirst({
        where: { id: input.id, userId: ctx.user.id, status: "FAILED" },
        select: { id: true, workflowId: true, creditsCost: true },
      });

      if (!generation) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.user.credits < generation.creditsCost) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient credits" });
      }

      await ctx.db.$transaction([
        ctx.db.user.update({
          where: { id: ctx.user.id },
          data: { credits: { decrement: generation.creditsCost } },
        }),
        ctx.db.generation.update({
          where: { id: input.id },
          data: { status: "PENDING", errorMessage: null },
        }),
      ]);

      try {
        const { generationQueue } = await import("@/lib/queue");
        const job = await generationQueue.add("generate", { generationId: input.id });
        await ctx.db.generation.update({
          where: { id: input.id },
          data: { status: "QUEUED", jobId: job.id },
        });
      } catch (err) {
        console.error("Queue error on retry:", err);
      }

      return { success: true };
    }),

  // Admin
  adminList: adminProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        status: z.nativeEnum(GenerationStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.generation.findMany({
        where: input.status ? { status: input.status } : undefined,
        orderBy: { createdAt: "desc" },
        take: input.limit,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          user: { select: { id: true, email: true, name: true } },
          workflow: { select: { name: true } },
        },
      });
    }),
});
