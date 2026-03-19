import { TRPCError } from "@trpc/server";
import { checkRateLimit } from "./redis";
import { Plan } from "@prisma/client";

const RATE_LIMITS: Record<Plan, { perMinute: number; perDay: number }> = {
  FREE:       { perMinute: 2,  perDay: 10 },
  BASIC:      { perMinute: 5,  perDay: 50 },
  PRO:        { perMinute: 20, perDay: 300 },
  ENTERPRISE: { perMinute: 60, perDay: 5000 },
};

export async function checkGenerationRateLimit(
  userId: string,
  plan: Plan
): Promise<void> {
  const limits = RATE_LIMITS[plan];

  const minuteKey = `ratelimit:gen:minute:${userId}`;
  const dayKey = `ratelimit:gen:day:${userId}`;

  const [minuteCheck, dayCheck] = await Promise.all([
    checkRateLimit(minuteKey, limits.perMinute, 60 * 1000),
    checkRateLimit(dayKey, limits.perDay, 24 * 60 * 60 * 1000),
  ]);

  if (!minuteCheck.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Please wait before generating again. (${minuteCheck.remaining} remaining this minute)`,
    });
  }

  if (!dayCheck.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Daily generation limit reached for your ${plan} plan. Upgrade to generate more.`,
    });
  }
}
