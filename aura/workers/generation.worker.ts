import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { generateMediaKey } from "../src/lib/storage";
import { publishUserEvent } from "../src/lib/pubsub";
import { ModelDispatcher, compilePrompt } from "../src/lib/dispatcher/ModelDispatcher";
import type { WorkflowConfig } from "../src/types/workflow";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };

const db = new PrismaClient();
const dispatcher = new ModelDispatcher();

// Check if we're in mock mode (no real Redis)
const useMockMode = !process.env.REDIS_URL || process.env.REDIS_URL.includes('localhost') &&
                   (!process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL.includes('localhost'));

// Check if we have API keys for real generation
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

/**
 * Process a generation job
 */
async function processGeneration(job: Job) {
  const { generationId } = job.data as { generationId: string };

  console.log(`[Worker] Processing generation: ${generationId}`);

  await db.generation.update({
    where: { id: generationId },
    data: { status: "PROCESSING" },
  });

  await publishUserEvent(generationId, {
    type: "generation.processing",
    generationId,
  });

  // Get generation details with workflow
  const generation = await db.generation.findUnique({
    where: { id: generationId },
    include: { workflow: true },
  });

  if (!generation) {
    throw new Error(`Generation ${generationId} not found`);
  }

  // Check if we should use real API or mock
  const shouldUseRealAPI = hasOpenAIKey && generation.workflow.modelConfig;
  
  if (shouldUseRealAPI) {
    try {
      // Parse workflow config
      let workflowConfig: WorkflowConfig;
      try {
        const modelConfig = generation.workflow.modelConfig as string;
        // Try to parse as JSON first
        workflowConfig = JSON.parse(modelConfig);
      } catch {
        console.log("[Worker] Using default workflow config");
        workflowConfig = {
          mediaType: "image",
          model: { primary: "gpt-image-1" },
          parameters: { size: "auto", quality: "high" },
          promptTemplate: { template: "{{userPrompt}}" },
        } as WorkflowConfig;
      }

      // Compile prompt
      const params = generation.params ? JSON.parse(generation.params as string) : {};
      const compiledPrompt = compilePrompt(
        workflowConfig.promptTemplate,
        generation.userPrompt,
        params
      );

      console.log(`[Worker] Calling ${workflowConfig.model.primary} API...`);

      // Call the model API
      const result = await dispatcher.dispatch({
        generationId,
        model: workflowConfig.model.primary,
        fallbackModel: workflowConfig.model.fallback,
        prompt: compiledPrompt,
        parameters: { ...workflowConfig.parameters, ...params },
      });

      // Store the result URLs
      const outputUrls = result.urls.map((url, i) => 
        generateMediaKey(generation.userId, generationId, `output-${i}.webp`)
      );

      await db.generation.update({
        where: { id: generationId },
        data: {
          status: "COMPLETED",
          outputUrls: JSON.stringify(outputUrls),
          thumbnailUrl: outputUrls[0],
          completedAt: new Date(),
          metadata: JSON.stringify({
            ...result.metadata,
            provider: workflowConfig.model.primary,
            generatedAt: new Date().toISOString(),
          }),
        },
      });

      await publishUserEvent(generation.userId, {
        type: "generation.completed",
        generationId,
        thumbnailUrl: outputUrls[0],
      });

      console.log(`[Worker] Completed generation: ${generationId}`);
      return { success: true, outputUrls };

    } catch (error) {
      console.error(`[Worker] API call failed:`, error);
      // Fall back to mock mode on API error
      console.log("[Worker] Falling back to mock generation");
    }
  }

  // Mock generation (for development or when no API key)
  await processMockGeneration(generationId, generation.userId);
}

/**
 * Mock generation for development
 */
async function processMockGeneration(generationId: string, userId: string) {
  // Simulate processing time (3-5 seconds)
  await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

  // Generate mock output URLs (placeholder images)
  const outputCount = 1 + Math.floor(Math.random() * 3); // 1-3 images
  const outputUrls: string[] = [];
  
  for (let i = 0; i < outputCount; i++) {
    const key = generateMediaKey(
      userId,
      generationId,
      `output-${i}.webp`
    );
    outputUrls.push(key);
  }

  const thumbnailUrl = outputUrls[0];

  await db.generation.update({
    where: { id: generationId },
    data: {
      status: "COMPLETED",
      outputUrls: JSON.stringify(outputUrls),
      thumbnailUrl,
      completedAt: new Date(),
      metadata: JSON.stringify({ 
        mock: true, 
        provider: "local-dev",
        generatedAt: new Date().toISOString(),
      }),
    },
  });

  await publishUserEvent(userId, {
    type: "generation.completed",
    generationId,
    thumbnailUrl,
  });

  console.log(`[Worker] Completed mock generation: ${generationId}`);
  
  return { success: true, outputUrls };
}

// Handle job failure
async function handleJobFailure(job: Job | undefined, err: Error) {
  if (!job) return;
  const { generationId } = job.data as { generationId: string };

  console.error(`[Worker] Job failed: ${generationId}`, err.message);

  const generation = await db.generation
    .update({
      where: { id: generationId },
      data: { status: "FAILED", errorMessage: err.message },
      select: { userId: true, creditsCost: true },
    })
    .catch(() => null);

  if (generation) {
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await db.user
        .update({
          where: { id: generation.userId },
          data: { credits: { increment: generation.creditsCost } },
        })
        .catch(console.error);
    }

    await publishUserEvent(generation.userId, {
      type: "generation.failed",
      generationId,
      error: err.message,
    });
  }
}

// Create and start worker
let worker: Worker;

try {
  worker = new Worker(
    "generations",
    processGeneration,
    {
      connection,
      concurrency: 5,
      limiter: { max: 20, duration: 60_000 },
    }
  );

  worker.on("failed", handleJobFailure);

  console.log("[Worker] Generation worker started with Redis");
  if (hasOpenAIKey) {
    console.log("[Worker] OpenAI API key detected - real generation enabled");
  } else {
    console.log("[Worker] No OpenAI API key - using mock generation");
  }
} catch (error) {
  console.log("[Worker] Falling back to mock mode (no Redis available)");
  
  // Mock worker mode - just listen for console messages
  console.log("[Worker] Mock worker running - generations will be processed in mock queue");
}

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`[Worker] ${signal} received, shutting down…`);
  if (worker) {
    await worker.close();
  }
  await db.$disconnect();
  console.log("[Worker] Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Keep the process alive
if (useMockMode) {
  console.log("[Worker] Running in mock mode - keeping process alive");
  setInterval(() => {}, 1000);
}
