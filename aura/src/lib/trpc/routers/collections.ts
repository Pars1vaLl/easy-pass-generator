import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { TRPCError } from "@trpc/server";

export const collectionsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.collection.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true } },
        items: {
          take: 4,
          orderBy: { addedAt: "desc" },
          include: {
            generation: { select: { thumbnailUrl: true, blurhash: true } },
          },
        },
      },
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const collection = await ctx.db.collection.findFirst({
        where: {
          id: input.id,
          OR: [{ userId: ctx.user.id }, { isPublic: true }],
        },
        include: {
          items: {
            orderBy: { addedAt: "desc" },
            include: {
              generation: {
                include: {
                  workflow: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      if (!collection) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return collection;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.collection.create({
        data: { ...input, userId: ctx.user.id },
      });
    }),

  addItem: protectedProcedure
    .input(
      z.object({
        collectionId: z.string().cuid(),
        generationId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [collection, generation] = await Promise.all([
        ctx.db.collection.findFirst({
          where: { id: input.collectionId, userId: ctx.user.id },
        }),
        ctx.db.generation.findFirst({
          where: { id: input.generationId, userId: ctx.user.id },
        }),
      ]);

      if (!collection || !generation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.collectionItem.upsert({
        where: {
          collectionId_generationId: {
            collectionId: input.collectionId,
            generationId: input.generationId,
          },
        },
        create: {
          collectionId: input.collectionId,
          generationId: input.generationId,
        },
        update: {},
      });
    }),

  removeItem: protectedProcedure
    .input(
      z.object({
        collectionId: z.string().cuid(),
        generationId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.collectionItem.deleteMany({
        where: {
          collectionId: input.collectionId,
          generationId: input.generationId,
          collection: { userId: ctx.user.id },
        },
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.collection.deleteMany({
        where: { id: input.id, userId: ctx.user.id },
      });
      return { success: true };
    }),
});
