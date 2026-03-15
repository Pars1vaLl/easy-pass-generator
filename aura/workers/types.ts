import type { AIModel, ModelParameters } from "../src/lib/dispatcher/types";

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
  parameters: ModelParameters;
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
