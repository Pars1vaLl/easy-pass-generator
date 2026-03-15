import { router } from "./server";
import { workflowsRouter } from "./routers/workflows";
import { generationsRouter } from "./routers/generations";
import { collectionsRouter } from "./routers/collections";
import { usersRouter } from "./routers/users";

export const appRouter = router({
  workflows: workflowsRouter,
  generations: generationsRouter,
  collections: collectionsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
