import { Queue } from "bullmq";

const connection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
};

export const generationQueue = new Queue("generations", {
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
