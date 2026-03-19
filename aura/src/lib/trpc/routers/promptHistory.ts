import { z } from "zod";
import { router, protectedProcedure } from "../server";

export const promptHistoryRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        workflowId: z.string().cuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.promptHistory.findMany({
        where: {
          userId: ctx.user.id,
          ...(input.workflowId && { workflowId: input.workflowId }),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          prompt: true,
          workflowId: true,
          createdAt: true,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.promptHistory.deleteMany({
        where: { id: input.id, userId: ctx.user.id },
      });
      return { success: true };
    }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.promptHistory.deleteMany({
      where: { userId: ctx.user.id },
    });
    return { success: true };
  }),
});
