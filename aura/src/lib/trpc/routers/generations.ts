import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../server";
import { TRPCError } from "@trpc/server";
import { moderatePrompt } from "@/lib/moderation";
import { checkGenerationRateLimit } from "@/lib/rate-limit";
import { signUrl } from "@/lib/storage";
import { auditLog } from "@/lib/audit";
import { Plan } from "@prisma/client";

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

      // Determine media type from workflow
      const mediaType = workflow.category.startsWith("VIDEO_") ? "VIDEO" : "IMAGE";

      // Atomic credit deduction + generation creation
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

      // Enqueue BullMQ job (imported lazily to avoid client-side issues)
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
        // Still return the generation ID even if queuing fails
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
      })
    )
    .query(async ({ ctx, input }) => {
      const generations = await ctx.db.generation.findMany({
        where: { userId: ctx.user.id },
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

  cancel: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const generation = await ctx.db.generation.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
          status: { in: ["PENDING", "QUEUED"] },
        },
      });

      if (!generation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.generation.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });

      return { success: true };
    }),

  // Admin: view all generations
  adminList: adminProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        status: z.enum(["PENDING","QUEUED","PROCESSING","COMPLETED","FAILED","CANCELLED"]).optional(),
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
