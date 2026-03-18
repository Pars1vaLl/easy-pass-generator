import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Publisher - one instance is fine for publish operations
let publisher: Redis | null = null;

function getPublisher(): Redis {
  if (!publisher) {
    publisher = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 3 });
  }
  return publisher;
}

export async function publishUserEvent(userId: string, event: object): Promise<void> {
  try {
    const pub = getPublisher();
    await pub.publish(`user:${userId}`, JSON.stringify(event));
  } catch (err) {
    console.error("[pubsub] publish error:", err);
  }
}

// Creates a dedicated subscriber Redis connection per SSE connection
export function createSubscriber(): Redis {
  return new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: null });
}
