import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { createSubscriber } from "@/lib/pubsub";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  let subscriber = createSubscriber();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller may be closed
        }
      };

      // Send initial connected event
      send({ type: "connected" });

      // Subscribe to user's channel
      try {
        await subscriber.connect();
        await subscriber.subscribe(`user:${userId}`);

        subscriber.on("message", (_channel, message) => {
          try {
            const data = JSON.parse(message);
            send(data);
          } catch {
            // Ignore parse errors
          }
        });

        subscriber.on("error", () => {
          // Redis error — stream continues, client will reconnect if needed
        });
      } catch {
        // Could not connect to Redis — fall back to keep-alive only
      }

      // Keep-alive ping every 25 seconds
      const keepAlive = setInterval(() => {
        if (closed) {
          clearInterval(keepAlive);
          return;
        }
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 25000);

      // Cleanup on client disconnect
      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(keepAlive);
        subscriber.disconnect();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
