import { TRPCError } from "@trpc/server";

const BLOCKED_TERMS = [
  "nude", "naked", "explicit", "porn", "nsfw", "xxx",
  "violence", "gore", "blood", "kill", "murder", "abuse",
];

export async function moderatePrompt(prompt: string): Promise<void> {
  const lower = prompt.toLowerCase();
  const blocked = BLOCKED_TERMS.some((term) => lower.includes(term));

  if (blocked) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Your prompt contains content that violates our usage policy.",
    });
  }

  // Optional: OpenAI moderation API
  if (process.env.OPENAI_API_KEY && process.env.MODERATION_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ input: prompt }),
      });

      const data = await response.json() as {
        results: Array<{ flagged: boolean; categories: Record<string, boolean> }>;
      };

      if (data.results[0]?.flagged) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your prompt was flagged by our content moderation system.",
        });
      }
    } catch (err) {
      if (err instanceof TRPCError) throw err;
      // Fail open if moderation API is unavailable
      console.error("Moderation API error:", err);
    }
  }
}
