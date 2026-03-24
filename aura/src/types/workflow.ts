// Canonical types shared between the Next.js app (src/) and the worker process.
// All other files should import from here instead of @/../../workers/types.

export type AIModel =
  | "nanobanana-v2"
  | "seedance-image-v1"
  | "gpt-image-1"
  | "sora-2"
  | "kling-ai-v1.5"
  | "seedance-video-v1"
  | "veo-3.1";

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

/**
 * Prompt template — two supported formats:
 *
 * 1. Template string (preferred):
 *    Use {{userPrompt}} and {{fieldName}} for interpolation.
 *    Example: "A {{style}} portrait of {{userPrompt}}, studio lighting"
 *
 * 2. Prefix / suffix (legacy, backward-compatible):
 *    Final = prefix + userPrompt + suffix
 */
export type PromptTemplate =
  | { template: string; system?: string; negativePrompt?: string }
  | { prefix: string; suffix: string; system?: string; negativePrompt?: string };

export interface WorkflowConfig {
  mediaType: "image" | "video";
  model: {
    primary: AIModel;
    fallback?: AIModel;
  };
  promptTemplate: PromptTemplate;
  parameters: ModelParameters;
  userInputSchema: UserInputField[];
  /** Clickable example prompts shown in the creator form */
  samplePrompts?: string[];
  creditCost: number;
}

export interface UserInputField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "slider" | "toggle";
  placeholder?: string;
  required: boolean;
  maxLength?: number;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  default?: unknown;
}
