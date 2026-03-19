import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../server";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { Plan, Role } from "@prisma/client";
import { auditLog } from "@/lib/audit";

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatarUrl: true,
        plan: true,
        credits: true,
        role: true,
        createdAt: true,
      },
    });
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.user.id },
        data: input,
        select: { id: true, name: true, avatarUrl: true },
      });
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z
          .string()
          .min(8)
          .regex(/[A-Z]/, "Must contain uppercase")
          .regex(/[0-9]/, "Must contain number"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: { passwordHash: true },
      });

      if (!user?.passwordHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No password set for this account",
        });
      }

      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Current password is incorrect",
        });
      }

      const newHash = await bcrypt.hash(input.newPassword, 12);
      await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: { passwordHash: newHash },
      });

      return { success: true };
    }),

  // Admin procedures
  adminList: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findMany({
        where: input.search
          ? {
              OR: [
                { email: { contains: input.search, mode: "insensitive" } },
                { phone: { contains: input.search } },
                { name: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : undefined,
        orderBy: { createdAt: "desc" },
        take: input.limit,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          plan: true,
          credits: true,
          role: true,
          banned: true,
          createdAt: true,
          _count: { select: { generations: true } },
        },
      });
    }),

  adminBan: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        reason: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { banned: true, bannedReason: input.reason },
      });
      await auditLog(ctx.user.id, "user.banned", {
        targetUserId: input.userId,
        reason: input.reason,
      });
      return { success: true };
    }),

  adminUnban: adminProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { banned: false, bannedReason: null },
      });
      await auditLog(ctx.user.id, "user.unbanned", { targetUserId: input.userId });
      return { success: true };
    }),

  adminAdjustCredits: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        credits: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { credits: input.credits },
      });
      await auditLog(ctx.user.id, "user.credits_adjusted", {
        targetUserId: input.userId,
        credits: input.credits,
      });
      return { success: true };
    }),

  adminSetPlan: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        plan: z.nativeEnum(Plan),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { plan: input.plan },
      });
      return { success: true };
    }),

  adminRegister: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
        role: z.nativeEnum(Role).default("USER"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already in use" });
      }
      const hash = await bcrypt.hash(input.password, 12);
      return ctx.db.user.create({
        data: {
          email: input.email,
          passwordHash: hash,
          name: input.name,
          role: input.role,
        },
        select: { id: true, email: true, name: true, role: true },
      });
    }),
});
