"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

interface SSEEvent {
  type: "generation.completed" | "generation.failed" | "generation.processing";
  generationId: string;
  thumbnailUrl?: string;
  error?: string;
}

export function useGenerationSSE() {
  const utils = trpc.useUtils();

  useEffect(() => {
    const es = new EventSource("/api/sse");

    es.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data) as SSEEvent;
        if (
          data.type === "generation.completed" ||
          data.type === "generation.failed" ||
          data.type === "generation.processing"
        ) {
          // Invalidate relevant queries to trigger refetch
          utils.generations.list.invalidate();
          utils.users.me.invalidate(); // Refresh credit count
        }
      } catch {
        // Ignore parse errors
      }
    });

    es.onerror = () => {
      // SSE will auto-reconnect
    };

    return () => es.close();
  }, [utils]);
}
