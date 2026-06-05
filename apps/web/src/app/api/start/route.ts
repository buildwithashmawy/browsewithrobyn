import { NextResponse } from "next/server";

// Forward a start request to the agent service (server-side, so AGENT_URL and
// browser↔agent CORS never reach the client).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    sessionId?: string;
    aspect?: number;
  };
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const agent = process.env.AGENT_URL || "http://localhost:8787";
  try {
    const r = await fetch(`${agent}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: body.sessionId, aspect: body.aspect }),
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch {
    return NextResponse.json(
      { error: `Agent service unreachable at ${agent}. Start it with: pnpm --filter agent dev` },
      { status: 502 },
    );
  }
}
