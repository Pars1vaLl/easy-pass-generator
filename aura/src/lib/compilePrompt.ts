/**
 * Client-side prompt compiler — mirrors the server-side compilePrompt in ModelDispatcher.
 * Used to show a live preview of the final prompt in the WorkflowCreator form.
 *
 * Supports:
 *   - Template string with {{variable}} placeholders ({{userPrompt}} + any param key)
 *   - Legacy prefix/suffix format
 */
export function compilePromptPreview(
  template: { template?: string; prefix?: string; suffix?: string } | null | undefined,
  userPrompt: string,
  params: Record<string, unknown> = {}
): string {
  if (!template) return userPrompt.trim();

  let text: string;

  if (typeof template.template === "string" && template.template.length > 0) {
    const vars: Record<string, string> = { userPrompt };
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) vars[k] = String(v);
    }
    text = template.template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
  } else {
    const prefix = template.prefix ?? "";
    const suffix = template.suffix ?? "";
    text = `${prefix}${userPrompt}${suffix}`;
  }

  return text.replace(/\s{2,}/g, " ").trim();
}

/**
 * Extract the list of variable names referenced in a template string.
 * Excludes `userPrompt` since that is always present.
 */
export function extractTemplateVariables(template: string): string[] {
  const matches = [...template.matchAll(/\{\{(\w+)\}\}/g)];
  return [...new Set(matches.map((m) => m[1]).filter((v) => v !== "userPrompt"))];
}
