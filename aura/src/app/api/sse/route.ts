import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial ping
      controller.enqueue(encoder.encode("data: {\"type\":\"connected\"}\n\n"));

      // Subscribe to Redis pub/sub for this user's events
      // In production, use a proper Redis subscriber
      // For now, we poll for generation updates every 2 seconds
      let closed = false;
      req.signal.addEventListener("abort", () => {
        closed = true;
        controller.close();
      });

      // Keep alive ping every 30s
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
      }, 30000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
