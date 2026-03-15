import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import superjson from "superjson";
import { ZodError } from "zod";

export async function createTRPCContext() {
  const session = await auth();
  return { session, db };
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const user = await db.user.findUnique({
    where: { id: ctx.session.user.id },
  });
  if (!user || user.banned) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Account suspended" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user,
    },
  });
});

const enforceUserIsAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const user = await db.user.findUnique({
    where: { id: ctx.session.user.id },
  });
  if (!user || user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, session: ctx.session, user } });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const adminProcedure = t.procedure.use(enforceUserIsAdmin);
