import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { sessionId?: string };
  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const agent = process.env.AGENT_URL || "http://localhost:8787";
  try {
    const r = await fetch(`${agent}/session/${body.sessionId}/stop`, {
      method: "POST",
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch {
    return NextResponse.json({ error: "Agent service unreachable" }, { status: 502 });
  }
}
