import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { ModelDispatcher, compilePrompt } from "../src/lib/dispatcher/ModelDispatcher";
import { decryptWorkflowConfig } from "../src/lib/crypto";
import { uploadToR2, generateMediaKey } from "../src/lib/storage";
import { publishUserEvent } from "../src/lib/pubsub";
import type { WorkflowConfig } from "../src/types/workflow";
import { Resend } from "resend";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };

const db = new PrismaClient();
const dispatcher = new ModelDispatcher();

/**
 * Stream a URL response body directly to R2 without buffering the whole file
 * in memory. Falls back to buffering if Content-Length is unavailable, since
 * PutObject requires a known size or a stream with chunked encoding.
 */
async function streamMediaToR2(
  url: string,
  key: string
): Promise<{ contentType: string }> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch media from provider: ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "image/webp";

  // Read as array buffer — Node.js fetch doesn't expose body as a Node.js Readable,
  // but we can stream chunk-by-chunk to avoid peak-memory spike with large videos.
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  await uploadToR2(key, buffer, contentType);

  return { contentType };
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

    await publishUserEvent(generation.userId, {
      type: "generation.processing",
      generationId,
    });

    // Decrypt workflow config
    let workflowConfig: WorkflowConfig;
    try {
      workflowConfig = decryptWorkflowConfig<WorkflowConfig>(
        generation.workflow.modelConfig as string
      );
    } catch {
      workflowConfig = generation.workflow.modelConfig as unknown as WorkflowConfig;
    }

    const params = (generation.params as Record<string, unknown>) ?? {};
    const compiledPrompt = compilePrompt(workflowConfig.promptTemplate, generation.userPrompt, params);

    await db.generation.update({
      where: { id: generationId },
      data: { resolvedPrompt: compiledPrompt.text },
    });

    const result = await dispatcher.dispatch({
      generationId,
      model: workflowConfig.model.primary,
      fallbackModel: workflowConfig.model.fallback,
      prompt: compiledPrompt,
      parameters: workflowConfig.parameters,
    });

    // Upload each output using streaming to avoid large RAM buffers
    const outputUrls: string[] = [];
    let thumbnailUrl: string | undefined;

    for (let i = 0; i < result.urls.length; i++) {
      const providerUrl = result.urls[i];
      const { contentType } = await streamMediaToR2(
        providerUrl,
        generateMediaKey(
          generation.userId,
          generationId,
          `output-${i}.${contentType.includes("video") ? "mp4" : "webp"}`
        )
      );
      const key = generateMediaKey(
        generation.userId,
        generationId,
        `output-${i}.${contentType.includes("video") ? "mp4" : "webp"}`
      );
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

    await publishUserEvent(generation.userId, {
      type: "generation.completed",
      generationId,
      thumbnailUrl,
    });

    if (generation.user.email) {
      sendCompletionEmail(generation.user.email, generation.user.name, generationId).catch(
        (err) => console.error("[email] completion email failed:", err)
      );
    }
  },
  {
    connection,
    concurrency: 10,
    limiter: { max: 50, duration: 60_000 },
  }
);

worker.on("failed", async (job, err) => {
  if (!job) return;
  const { generationId } = job.data as { generationId: string };

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
});

// ─── React Email template for completion notification ─────────────────────────

async function sendCompletionEmail(email: string, name: string | null, generationId: string) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXTAUTH_URL ?? "https://aura.app";
  const from = process.env.EMAIL_FROM ?? "AURA <noreply@aura.app>";

  await resend.emails.send({
    from,
    to: email,
    subject: "Your creation is ready ✨",
    html: buildCompletionEmailHtml({ name, appUrl, generationId }),
  });
}

function buildCompletionEmailHtml({
  name,
  appUrl,
}: {
  name: string | null;
  appUrl: string;
  generationId: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your creation is ready</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#141414;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
          <!-- Header gradient bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c5af5,#c084fc,#f472b6);height:4px;"></td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <!-- Logo -->
              <p style="margin:0 0 24px;font-size:20px;font-weight:800;color:#f0f0f0;letter-spacing:-0.5px;">⚡ AURA</p>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f0f0f0;line-height:1.3;">
                Your creation is ready!
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#a0a0a0;line-height:1.6;">
                Hey ${name ?? "there"}, your AI generation completed successfully. Head to your gallery to view, download, or share it.
              </p>
              <a href="${appUrl}/gallery"
                 style="display:inline-block;padding:14px 28px;background:#7c5af5;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:-0.2px;">
                View in Gallery →
              </a>
              <hr style="border:none;border-top:1px solid #2a2a2a;margin:32px 0;" />
              <p style="margin:0;font-size:12px;color:#404040;line-height:1.6;">
                You're receiving this because you have email notifications enabled on AURA.<br />
                <a href="${appUrl}/settings" style="color:#7c5af5;text-decoration:none;">Manage notifications</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} received, shutting down…`);
  await worker.close();
  await db.$disconnect();
  console.log("[worker] Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log("[worker] Generation worker started");
