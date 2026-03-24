import { Queue, Job } from "bullmq";
import { randomUUID } from "crypto";

// Mock job class for local development
class MockJob {
  id: string;
  data: any;
  opts: any;

  constructor(id: string, data: any, opts: any) {
    this.id = id;
    this.data = data;
    this.opts = opts;
  }
}

// Mock queue for local development when Redis is not available
class MockQueue {
  private jobs: Map<string, MockJob> = new Map();
  private handlers: Map<string, Function> = new Map();

  async add(name: string, data: any, opts?: any): Promise<MockJob> {
    const id = randomUUID();
    const job = new MockJob(id, data, opts);
    this.jobs.set(id, job);
    
    console.log(`[Mock Queue] Job added: ${name} (${id})`);
    
    // Simulate async processing
    setTimeout(async () => {
      const handler = this.handlers.get(name);
      if (handler) {
        try {
          await handler(job);
        } catch (e) {
          console.error(`[Mock Queue] Job failed:`, e);
        }
      }
    }, 1000);

    return job;
  }

  on(event: string, handler: Function) {
    this.handlers.set(event, handler);
  }

  getJob(id: string): MockJob | undefined {
    return this.jobs.get(id);
  }
}

// Determine if we should use real Redis or mock
const useMockQueue = !process.env.REDIS_URL || process.env.REDIS_URL.includes('localhost') && 
                     (!process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL.includes('localhost'));

let generationQueue: Queue | MockQueue;

if (useMockQueue) {
  console.log('[Queue] Using mock queue for local development');
  generationQueue = new MockQueue();
} else {
  const connection = {
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
  };

  generationQueue = new Queue("generations", {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 500 },
    },
  });
}

export { generationQueue };
