import { TRPCError } from "@trpc/server";

const BLOCKED_TERMS = [
  "nude", "naked", "explicit", "porn", "nsfw", "xxx",
  "violence", "gore", "blood", "kill", "murder", "abuse",
  "suicide", "self-harm", "terrorist", "weapon",
];

/** Moderate a single text string and throw if blocked. */
async function moderateText(text: string): Promise<void> {
  const lower = text.toLowerCase();
  const blocked = BLOCKED_TERMS.some((term) => lower.includes(term));
  if (blocked) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Your prompt contains content that violates our usage policy.",
    });
  }

  if (process.env.OPENAI_API_KEY && process.env.MODERATION_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ input: text }),
      });

      const data = await response.json() as {
        results: Array<{ flagged: boolean }>;
      };

      if (data.results[0]?.flagged) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your prompt was flagged by our content moderation system.",
        });
      }
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      console.error("Moderation API error:", err);
    }
  }
}

/**
 * Moderate the main user prompt AND all string-typed params.
 * This prevents bypass via free-text param fields.
 */
export async function moderatePrompt(
  prompt: string,
  params: Record<string, unknown> = {}
): Promise<void> {
  // Check main prompt
  await moderateText(prompt);

  // Check string values in params (textarea, text fields)
  const stringParams = Object.values(params).filter(
    (v) => typeof v === "string" && v.length > 0
  ) as string[];

  await Promise.all(stringParams.map((v) => moderateText(v)));
}
