export type AIModel =
  | "nanobanana-v2"
  | "seedance-image-v1"
  | "gpt-image-1"
  | "sora-2"
  | "kling-ai-v1.5"
  | "seedance-video-v1"
  | "veo-3.1";

export interface WorkflowConfig {
  mediaType: "image" | "video";
  model: {
    primary: AIModel;
    fallback?: AIModel;
  };
  promptTemplate: {
    system?: string;
    prefix: string;
    suffix: string;
    negativePrompt?: string;
  };
  parameters: {
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
    quality?: "draft" | "standard" | "hd";
    [key: string]: unknown;
  };
  userInputSchema: UserInputField[];
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
