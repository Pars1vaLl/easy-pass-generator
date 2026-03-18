import type { AIModel, ModelParameters } from "../src/lib/dispatcher/types";

/**
 * Prompt template — supports two formats:
 *
 * 1. Template string (preferred):
 *    Use `{{userPrompt}}` and `{{fieldName}}` placeholders.
 *    Example: "A {{style}} portrait of {{userPrompt}}, studio lighting"
 *
 * 2. Prefix / suffix (legacy):
 *    Final prompt = prefix + userPrompt + suffix
 *    Example: prefix="A cinematic ", suffix=", 4K quality"
 *
 * Both formats support optional `system` and `negativePrompt`.
 */
export type PromptTemplate =
  | {
      template: string;         // e.g. "A {{style}} portrait of {{userPrompt}}, dramatic lighting"
      system?: string;
      negativePrompt?: string;
    }
  | {
      prefix: string;           // prepended before user input
      suffix: string;           // appended after user input
      system?: string;
      negativePrompt?: string;
    };

export interface WorkflowConfig {
  mediaType: "image" | "video";
  model: {
    primary: AIModel;
    fallback?: AIModel;
  };
  promptTemplate: PromptTemplate;
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
