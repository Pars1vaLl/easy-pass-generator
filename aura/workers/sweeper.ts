/**
 * Stale Generation Sweeper
 *
 * Runs every 5 minutes. Finds generations stuck in PENDING/QUEUED/PROCESSING
 * for more than 15 minutes and:
 *   1. Marks them as FAILED with a human-readable error message
 *   2. Refunds the user's credits
 *   3. Publishes a generation.failed event so the gallery UI updates
 *
 * Start this alongside the main generation worker:
 *   npx tsx workers/sweeper.ts
 */
import { PrismaClient } from "@prisma/client";
import { publishUserEvent } from "../src/lib/pubsub";

const db = new PrismaClient();
const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;   // every 5 minutes

async function sweep() {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

  const stale = await db.generation.findMany({
    where: {
      status: { in: ["PENDING", "QUEUED", "PROCESSING"] },
      createdAt: { lt: cutoff },
    },
    select: { id: true, userId: true, creditsCost: true },
  });

  if (stale.length === 0) return;

  console.log(`[sweeper] Found ${stale.length} stale generation(s), recovering…`);

  for (const gen of stale) {
    try {
      await db.$transaction([
        db.generation.update({
          where: { id: gen.id },
          data: {
            status: "FAILED",
            errorMessage: "Generation timed out. Your credits have been refunded.",
          },
        }),
        db.user.update({
          where: { id: gen.userId },
          data: { credits: { increment: gen.creditsCost } },
        }),
      ]);

      await publishUserEvent(gen.userId, {
        type: "generation.failed",
        generationId: gen.id,
        error: "Generation timed out. Credits refunded.",
      });

      console.log(`[sweeper] Recovered generation ${gen.id}, refunded ${gen.creditsCost} credits`);
    } catch (err) {
      console.error(`[sweeper] Failed to recover generation ${gen.id}:`, err);
    }
  }
}

async function main() {
  console.log("[sweeper] Stale generation sweeper started");

  // Run immediately on startup
  await sweep().catch(console.error);

  // Then on interval
  setInterval(() => {
    sweep().catch(console.error);
  }, SWEEP_INTERVAL_MS);
}

main().catch((err) => {
  console.error("[sweeper] Fatal error:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await db.$disconnect();
  process.exit(0);
});
process.on("SIGINT", async () => {
  await db.$disconnect();
  process.exit(0);
});
