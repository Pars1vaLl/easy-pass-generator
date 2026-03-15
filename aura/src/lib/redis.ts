import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiting helpers
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowStart = now - windowMs;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
  pipeline.zcard(key);
  pipeline.expire(key, Math.ceil(windowMs / 1000));

  const results = await pipeline.exec();
  const count = results[2] as number;

  return {
    allowed: count <= max,
    remaining: Math.max(0, max - count),
  };
}

export async function checkOTPRateLimit(phone: string): Promise<boolean> {
  const key = `otp:${phone}`;
  const { allowed } = await checkRateLimit(key, 3, 10 * 60 * 1000); // 3 per 10 min
  return allowed;
}
