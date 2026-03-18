import { router } from "./server";
import { workflowsRouter } from "./routers/workflows";
import { generationsRouter } from "./routers/generations";
import { collectionsRouter } from "./routers/collections";
import { usersRouter } from "./routers/users";
import { promptHistoryRouter } from "./routers/promptHistory";

export const appRouter = router({
  workflows: workflowsRouter,
  generations: generationsRouter,
  collections: collectionsRouter,
  users: usersRouter,
  promptHistory: promptHistoryRouter,
});

export type AppRouter = typeof appRouter;
