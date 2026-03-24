export type AIModel =
  | "nanobanana-v2"
  | "seedance-image-v1"
  | "gpt-image-1"
  | "sora-2"
  | "kling-ai-v1.5"
  | "seedance-video-v1"
  | "veo-3.1";

export interface CompiledPrompt {
  text: string;
  negativePrompt?: string;
  system?: string;
}

export interface ModelParameters {
  width?: number;
  height?: number;
  aspectRatio?: string;
  steps?: number;
  cfgScale?: number;
  seed?: number | "random";
  duration?: number;
  fps?: number;
  motionStrength?: number;
  style?: string;
  quality?: "draft" | "standard" | "hd" | "auto" | "low" | "medium" | "high";
  // GPT Image API specific parameters
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  moderation?: "auto" | "low";
  background?: "transparent" | "opaque" | "auto";
  n?: number;  // Number of images (1-10 for gpt-image-1)
  [key: string]: unknown;
}

export interface DispatchResult {
  urls: string[];  // Remote URLs of generated media
  metadata: Record<string, unknown> & {
    model: string;
    width?: number;
    height?: number;
    duration?: number;
  };
}

export interface GenerationJob {
  generationId: string;
  model: AIModel;
  fallbackModel?: AIModel;
  prompt: CompiledPrompt;
  parameters: ModelParameters;
}
