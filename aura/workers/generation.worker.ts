import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { ModelDispatcher, compilePrompt } from "../src/lib/dispatcher/ModelDispatcher";
import { decryptWorkflowConfig } from "../src/lib/crypto";
import { uploadToR2, generateMediaKey } from "../src/lib/storage";
import { publishUserEvent } from "../src/lib/pubsub";
import type { WorkflowConfig } from "./types";

const connection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
};

const db = new PrismaClient();
const dispatcher = new ModelDispatcher();

async function fetchMediaBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch media: ${response.statusText}`);
  const contentType = response.headers.get("content-type") ?? "image/webp";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, contentType };
}

const worker = new Worker(
  "generations",
  async (job) => {
    const { generationId } = job.data as { generationId: string };

    await db.generation.update({
      where: { id: generationId },
      data: { status: "PROCESSING" },
    });

    const generation = await db.generation.findUniqueOrThrow({
      where: { id: generationId },
      include: { workflow: true, user: { select: { email: true, name: true } } },
    });

    // Notify processing started
    await publishUserEvent(generation.userId, {
      type: "generation.processing",
      generationId,
    });

    let workflowConfig: WorkflowConfig;
    try {
      workflowConfig = decryptWorkflowConfig<WorkflowConfig>(
        generation.workflow.modelConfig as string
      );
    } catch {
      workflowConfig = generation.workflow.modelConfig as unknown as WorkflowConfig;
    }

    const compiledPrompt = compilePrompt(
      workflowConfig.promptTemplate,
      generation.userPrompt
    );

    const result = await dispatcher.dispatch({
      generationId,
      model: workflowConfig.model.primary,
      fallbackModel: workflowConfig.model.fallback,
      prompt: compiledPrompt,
      parameters: workflowConfig.parameters,
    });

    const outputUrls: string[] = [];
    let thumbnailUrl: string | undefined;

    for (let i = 0; i < result.urls.length; i++) {
      const { buffer, contentType } = await fetchMediaBuffer(result.urls[i]);
      const ext = contentType.includes("video") ? "mp4" : "webp";
      const key = generateMediaKey(generation.userId, generationId, `output-${i}.${ext}`);
      await uploadToR2(key, buffer, contentType);
      outputUrls.push(key);
      if (i === 0) thumbnailUrl = key;
    }

    await db.generation.update({
      where: { id: generationId },
      data: {
        status: "COMPLETED",
        outputUrls,
        thumbnailUrl,
        completedAt: new Date(),
        metadata: result.metadata as object,
      },
    });

    // Notify completion via pub/sub
    await publishUserEvent(generation.userId, {
      type: "generation.completed",
      generationId,
      thumbnailUrl,
    });

    // Send completion email if configured
    if (generation.user.email) {
      sendCompletionEmail(generation.user.email, generation.user.name, generationId).catch(
        (err) => console.error("[email] Failed to send completion email:", err)
      );
    }
  },
  {
    connection,
    concurrency: 10,
    limiter: { max: 50, duration: 60000 },
  }
);

worker.on("failed", async (job, err) => {
  if (!job) return;
  const { generationId } = job.data as { generationId: string };

  const generation = await db.generation.update({
    where: { id: generationId },
    data: { status: "FAILED", errorMessage: err.message },
    select: { userId: true, creditsCost: true },
  }).catch(() => null);

  if (generation) {
    // Refund credits on permanent failure (after all retries exhausted)
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await db.user.update({
        where: { id: generation.userId },
        data: { credits: { increment: generation.creditsCost } },
      }).catch(console.error);
    }

    await publishUserEvent(generation.userId, {
      type: "generation.failed",
      generationId,
      error: err.message,
    });
  }
});

async function sendCompletionEmail(email: string, name: string | null, generationId: string) {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXTAUTH_URL ?? "https://aura.app";

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "AURA <noreply@aura.app>",
    to: email,
    subject: "Your creation is ready ✨",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0a;color:#f0f0f0;border-radius:12px;">
        <h1 style="font-size:24px;margin-bottom:8px;">Your creation is ready!</h1>
        <p style="color:#a0a0a0;margin-bottom:24px;">
          Hey ${name ?? "there"}, your AI generation has completed successfully.
        </p>
        <a href="${appUrl}/gallery" style="display:inline-block;padding:12px 24px;background:#7c5af5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
          View in Gallery
        </a>
        <p style="color:#606060;font-size:12px;margin-top:32px;">
          You're receiving this because you have email notifications enabled.
        </p>
      </div>
    `,
  });
}

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`[worker] Received ${signal}, shutting down gracefully...`);
  await worker.close();
  await db.$disconnect();
  console.log("[worker] Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log("[worker] Generation worker started");
