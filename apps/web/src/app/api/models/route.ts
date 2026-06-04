import { NextResponse } from "next/server";

// Proxy + cache OpenRouter's public model list. Flags vision-capable models so
// the picker can warn against text-only models (the agent sends screenshots).
export const revalidate = 3600;

interface ORModel {
  id: string;
  name?: string;
  architecture?: { input_modalities?: string[] };
}

export async function GET() {
  try {
    const headers: Record<string, string> = {};
    if (process.env.OPENROUTER_API_KEY) {
      headers.Authorization = `Bearer ${process.env.OPENROUTER_API_KEY}`;
    }
    const r = await fetch("https://openrouter.ai/api/v1/models", {
      headers,
      next: { revalidate: 3600 },
    });
    if (!r.ok) return NextResponse.json({ models: [] });

    const j = (await r.json()) as { data?: ORModel[] };
    const models = (j.data ?? []).map((m) => ({
      id: m.id,
      name: m.name ?? m.id,
      vision: Array.isArray(m.architecture?.input_modalities)
        ? m.architecture!.input_modalities!.includes("image")
        : false,
    }));
    // vision-capable first, then alphabetical
    models.sort((a, b) =>
      a.vision === b.vision ? a.name.localeCompare(b.name) : a.vision ? -1 : 1,
    );
    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ models: [] });
  }
}
