import { z } from "zod";
import { router, protectedProcedure, publicProcedure, adminProcedure } from "../server";
import { TRPCError } from "@trpc/server";
import { moderatePrompt } from "@/lib/moderation";
import { checkGenerationRateLimit } from "@/lib/rate-limit";
import { signUrl } from "@/lib/storage";
import { auditLog } from "@/lib/audit";
import { Plan, GenerationStatus, MediaType } from "@prisma/client";
import { randomBytes } from "crypto";

export const generationsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        workflowId: z.string().cuid(),
        userPrompt: z.string().min(1).max(500),
        params: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const workflow = await ctx.db.workflow.findUnique({
        where: { id: input.workflowId, isActive: true },
      });

      if (!workflow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
      }

      if (user.credits < workflow.creditCost) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient credits",
        });
      }

      await checkGenerationRateLimit(user.id, user.plan as Plan);
      await moderatePrompt(input.userPrompt);

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
            status: "PENDING",
            mediaType,
            creditsCost: workflow.creditCost,
          },
        }),
      ]);

      // Save prompt to history (keep last 50 per user)
      ctx.db.promptHistory.create({
        data: {
          userId: user.id,
          prompt: input.userPrompt,
          workflowId: input.workflowId,
        },
      }).then(async () => {
        // Prune old entries, keep last 50
        const old = await ctx.db.promptHistory.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          skip: 50,
          select: { id: true },
        });
        if (old.length > 0) {
          await ctx.db.promptHistory.deleteMany({
            where: { id: { in: old.map((r) => r.id) } },
          });
        }
      }).catch(() => null);

      try {
        const { generationQueue } = await import("@/lib/queue");
        const job = await generationQueue.add("generate", {
          generationId: generation.id,
        });
        await ctx.db.generation.update({
          where: { id: generation.id },
          data: { status: "QUEUED", jobId: job.id },
        });
      } catch (err) {
        console.error("Queue error:", err);
      }

      await auditLog(user.id, "generation.created", {
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
      const where = {
        userId: ctx.user.id,
        ...(input.status && { status: input.status }),
        ...(input.mediaType && { mediaType: input.mediaType }),
        ...(input.workflowId && { workflowId: input.workflowId }),
        ...(input.favoritesOnly && { isFavorite: true }),
      };

      const generations = await ctx.db.generation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          workflow: {
            select: { name: true, category: true, slug: true },
          },
        },
      });

      const withSignedUrls = await Promise.all(
        generations.map(async (g) => ({
          ...g,
          outputUrls: await Promise.all(
            g.outputUrls.map((url) => signUrl(url, 3600).catch(() => url))
          ),
        }))
      );

      return {
        generations: withSignedUrls.slice(0, input.limit),
        nextCursor:
          withSignedUrls.length > input.limit
            ? withSignedUrls[input.limit].id
            : undefined,
      };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        include: {
          workflow: {
            select: { name: true, category: true, slug: true },
          },
        },
      });

      if (!generation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const signedUrls = await Promise.all(
        generation.outputUrls.map((url) => signUrl(url, 3600).catch(() => url))
      );

      return { ...generation, outputUrls: signedUrls };
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findFirst({
        where: { id: input.id, userId: ctx.user.id },
        select: { isFavorite: true },
      });

      if (!generation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

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

      if (!generation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Return existing token or create new one
      if (generation.shareToken) {
        return { shareToken: generation.shareToken };
      }

      const shareToken = randomBytes(16).toString("hex");
      await ctx.db.generation.update({
        where: { id: input.id },
        data: { shareToken },
      });

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
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findFirst({
        where: { shareToken: input.token, status: "COMPLETED" },
        include: {
          workflow: { select: { name: true, category: true } },
          user: { select: { name: true, avatarUrl: true } },
        },
      });

      if (!generation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const signedUrls = await Promise.all(
        generation.outputUrls.map((url) => signUrl(url, 3600).catch(() => url))
      );

      return {
        ...generation,
        outputUrls: signedUrls,
        // Never expose sensitive fields
        userId: undefined,
        shareToken: undefined,
        jobId: undefined,
        errorMessage: undefined,
      };
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
          status: { in: ["PENDING", "QUEUED"] },
        },
        select: { id: true, creditsCost: true },
      });

      if (!generation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Cancel and refund credits atomically
      await ctx.db.$transaction([
        ctx.db.generation.update({
          where: { id: input.id },
          data: { status: "CANCELLED" },
        }),
        ctx.db.user.update({
          where: { id: ctx.user.id },
          data: { credits: { increment: generation.creditsCost } },
        }),
      ]);

      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const [total, completed, failed, favorites] = await Promise.all([
      ctx.db.generation.count({ where: { userId: ctx.user.id } }),
      ctx.db.generation.count({ where: { userId: ctx.user.id, status: "COMPLETED" } }),
      ctx.db.generation.count({ where: { userId: ctx.user.id, status: "FAILED" } }),
      ctx.db.generation.count({ where: { userId: ctx.user.id, isFavorite: true } }),
    ]);

    return { total, completed, failed, favorites, successRate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }),

  // Admin: view all generations
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
