import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { ModelDispatcher, compilePrompt } from "../src/lib/dispatcher/ModelDispatcher";
import { decryptWorkflowConfig } from "../src/lib/crypto";
import { uploadToR2, generateMediaKey } from "../src/lib/storage";
import type { WorkflowConfig } from "./types";

const connection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
};

const db = new PrismaClient();
const dispatcher = new ModelDispatcher();

// Simple SSE notification via Redis publish
async function publishEvent(userId: string, event: object): Promise<void> {
  // In production, use a Redis pub/sub mechanism
  // For now, we rely on polling-based invalidation
  console.log(`[SSE] User ${userId}:`, event);
}

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
      include: { workflow: true },
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

    await publishEvent(generation.userId, {
      type: "generation.completed",
      generationId,
      thumbnailUrl,
    });
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
  await db.generation.update({
    where: { id: generationId },
    data: { status: "FAILED", errorMessage: err.message },
  }).catch(console.error);
});

console.log("Generation worker started");
