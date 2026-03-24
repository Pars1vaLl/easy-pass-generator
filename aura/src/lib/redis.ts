// Local mock implementation for development
const memoryStore = new Map<string, any>();
const sortedSets = new Map<string, Array<{ score: number; member: string }>>();

class MockRedis {
  async get<T>(key: string): Promise<T | null> {
    const value = memoryStore.get(key);
    if (value && value.expires && value.expires < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return value?.data ?? null;
  }

  async set(key: string, value: any, opts?: { ex?: number }): Promise<void> {
    memoryStore.set(key, {
      data: value,
      expires: opts?.ex ? Date.now() + opts.ex * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    memoryStore.delete(key);
  }

  pipeline() {
    const operations: Array<() => Promise<any>> = [];
    
    return {
      zremrangebyscore: (key: string, min: number, max: number) => {
        operations.push(async () => {
          const set = sortedSets.get(key) || [];
          const filtered = set.filter(item => item.score < min || item.score > max);
          sortedSets.set(key, filtered);
          return filtered.length;
        });
        return this;
      },
      zadd: (key: string, ...members: Array<{ score: number; member: string } | number | string>) => {
        operations.push(async () => {
          let set = sortedSets.get(key) || [];
          // Handle different call signatures
          if (members.length === 1 && typeof members[0] === 'object') {
            set.push(members[0] as { score: number; member: string });
          } else {
            // Handle array format: [score1, member1, score2, member2, ...]
            for (let i = 0; i < members.length; i += 2) {
              if (typeof members[i] === 'number') {
                set.push({ score: members[i] as number, member: String(members[i + 1]) });
              }
            }
          }
          sortedSets.set(key, set);
          return set.length;
        });
        return this;
      },
      zcard: (key: string) => {
        operations.push(async () => {
          return sortedSets.get(key)?.length || 0;
        });
        return this;
      },
      expire: (key: string, seconds: number) => {
        operations.push(async () => 1);
        return this;
      },
      exec: async () => {
        const results = [];
        for (const op of operations) {
          try {
            results.push(await op());
          } catch (e) {
            results.push(null);
          }
        }
        return results;
      },
    };
  }
}

// Use real Upstash Redis if configured, otherwise use mock
let redis: MockRedis;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && 
      process.env.UPSTASH_REDIS_REST_TOKEN &&
      !process.env.UPSTASH_REDIS_REST_URL.includes('localhost')) {
    const { Redis } = require("@upstash/redis");
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } else {
    redis = new MockRedis();
  }
} catch {
  redis = new MockRedis();
}

export { redis };

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
