import type { AIModel, CompiledPrompt, ModelParameters, DispatchResult, GenerationJob } from "./types";

class ProviderUnavailableError extends Error {
  constructor(model: string) {
    super(`Provider ${model} is unavailable`);
  }
}

class UnknownModelError extends Error {
  constructor(model: string) {
    super(`Unknown model: ${model}`);
  }
}

// Simple in-memory circuit breaker
const circuitBreakerState = new Map<string, {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}>();

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 60_000;

function getCircuitBreaker(model: string) {
  if (!circuitBreakerState.has(model)) {
    circuitBreakerState.set(model, { failures: 0, lastFailure: 0, isOpen: false });
  }
  const state = circuitBreakerState.get(model)!;

  return {
    isOpen(): boolean {
      if (state.isOpen && Date.now() - state.lastFailure > CIRCUIT_BREAKER_RESET_MS) {
        state.isOpen = false;
        state.failures = 0;
      }
      return state.isOpen;
    },
    recordSuccess() {
      state.failures = 0;
      state.isOpen = false;
    },
    recordFailure() {
      state.failures++;
      state.lastFailure = Date.now();
      if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
        state.isOpen = true;
      }
    },
  };
}

async function generateWithOpenAI(
  prompt: CompiledPrompt,
  params: ModelParameters,
  model: "dall-e-3" | "gpt-image-1"
): Promise<DispatchResult> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      prompt: prompt.text,
      n: 1,
      size: `${params.width ?? 1024}x${params.height ?? 1024}`,
      quality: params.quality === "hd" ? "hd" : "standard",
      response_format: "url",
    }),
  });

  const data = await response.json() as { data?: Array<{ url: string }>; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);

  return {
    urls: data.data?.map((d) => d.url) ?? [],
    metadata: { model, width: params.width ?? 1024, height: params.height ?? 1024 },
  };
}

async function generateWithSeedance(
  prompt: CompiledPrompt,
  params: ModelParameters,
  type: "image" | "video"
): Promise<DispatchResult> {
  // Seedance API integration placeholder
  const response = await fetch(`https://api.seedance.ai/v1/${type}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SEEDANCE_API_KEY}`,
    },
    body: JSON.stringify({ prompt: prompt.text, ...params }),
  });

  const data = await response.json() as { outputs?: string[]; url?: string };
  return {
    urls: data.outputs ?? (data.url ? [data.url] : []),
    metadata: { model: `seedance-${type}-v1`, ...params } as DispatchResult["metadata"],
  };
}

async function generateWithKling(
  prompt: CompiledPrompt,
  params: ModelParameters
): Promise<DispatchResult> {
  const response = await fetch("https://api.klingai.com/v1/videos/text2video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.KLING_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: prompt.text,
      negative_prompt: prompt.negativePrompt,
      duration: params.duration ?? 5,
      aspect_ratio: params.aspectRatio ?? "16:9",
    }),
  });

  const data = await response.json() as { data?: { task_id: string }; error?: string };
  if (data.error) throw new Error(data.error);

  // Kling returns a task ID, poll for completion
  const taskId = data.data?.task_id;
  if (!taskId) throw new Error("No task ID from Kling");

  // Poll for result
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const poll = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
      headers: { Authorization: `Bearer ${process.env.KLING_API_KEY}` },
    });
    const result = await poll.json() as { data?: { task_status: string; task_result?: { videos: Array<{ url: string }> } } };
    if (result.data?.task_status === "succeed") {
      return {
        urls: result.data.task_result?.videos.map((v) => v.url) ?? [],
        metadata: { model: "kling-ai-v1.5", ...params } as DispatchResult["metadata"],
      };
    }
    if (result.data?.task_status === "failed") {
      throw new Error("Kling generation failed");
    }
  }

  throw new Error("Kling generation timed out");
}

async function generateWithVeo(
  prompt: CompiledPrompt,
  params: ModelParameters
): Promise<DispatchResult> {
  // Veo 3.1 API placeholder
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/veo-3.1:generateVideo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.VEO_API_KEY!,
    },
    body: JSON.stringify({
      prompt: { text: prompt.text },
      generationConfig: {
        durationSeconds: params.duration ?? 8,
        aspectRatio: params.aspectRatio ?? "16:9",
      },
    }),
  });

  const data = await response.json() as { name?: string };
  // Returns a long-running operation
  const operationName = data.name;
  if (!operationName) throw new Error("No operation name from Veo");

  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const poll = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operationName}`, {
      headers: { "x-goog-api-key": process.env.VEO_API_KEY! },
    });
    const op = await poll.json() as { done?: boolean; response?: { videos?: Array<{ uri: string }> } };
    if (op.done && op.response?.videos) {
      return {
        urls: op.response.videos.map((v) => v.uri),
        metadata: { model: "veo-3.1", ...params } as DispatchResult["metadata"],
      };
    }
  }

  throw new Error("Veo generation timed out");
}

async function generateWithNanoBanana(
  prompt: CompiledPrompt,
  params: ModelParameters
): Promise<DispatchResult> {
  const response = await fetch("https://api.nanobanana.ai/v2/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NANOBANANA_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: prompt.text,
      negative_prompt: prompt.negativePrompt,
      width: params.width ?? 1024,
      height: params.height ?? 1024,
      steps: params.steps ?? 30,
      cfg_scale: params.cfgScale ?? 7,
      seed: params.seed === "random" ? undefined : params.seed,
    }),
  });

  const data = await response.json() as { images?: string[]; error?: string };
  if (data.error) throw new Error(data.error);

  return {
    urls: data.images ?? [],
    metadata: { model: "nanobanana-v2", ...params } as DispatchResult["metadata"],
  };
}

export class ModelDispatcher {
  async dispatch(job: GenerationJob): Promise<DispatchResult> {
    const { model, prompt, parameters, generationId } = job;
    const breaker = getCircuitBreaker(model);

    if (breaker.isOpen()) {
      if (job.fallbackModel) {
        return this.dispatch({ ...job, model: job.fallbackModel, fallbackModel: undefined });
      }
      throw new ProviderUnavailableError(model);
    }

    try {
      const result = await this.routeToProvider(model, prompt, parameters);
      breaker.recordSuccess();
      return result;
    } catch (err) {
      breaker.recordFailure();
      throw err;
    }
  }

  private async routeToProvider(
    model: AIModel,
    prompt: CompiledPrompt,
    params: ModelParameters
  ): Promise<DispatchResult> {
    switch (model) {
      case "nanobanana-v2":
        return generateWithNanoBanana(prompt, params);
      case "seedance-image-v1":
        return generateWithSeedance(prompt, params, "image");
      case "gpt-image-1":
        return generateWithOpenAI(prompt, params, "gpt-image-1");
      case "sora-2":
        // SORA-2 via OpenAI video API (placeholder — API may differ)
        return generateWithOpenAI(prompt, params, "dall-e-3");
      case "kling-ai-v1.5":
        return generateWithKling(prompt, params);
      case "seedance-video-v1":
        return generateWithSeedance(prompt, params, "video");
      case "veo-3.1":
        return generateWithVeo(prompt, params);
      default:
        throw new UnknownModelError(model);
    }
  }
}

export function compilePrompt(
  template: { prefix: string; suffix: string; system?: string; negativePrompt?: string },
  userPrompt: string
): CompiledPrompt {
  return {
    text: `${template.prefix}${userPrompt}${template.suffix}`,
    negativePrompt: template.negativePrompt,
    system: template.system,
  };
}
