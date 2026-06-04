import type { ModelInfo } from "@/lib/types";

// Fallback shortlist if the live OpenRouter /models fetch fails.
export const CURATED_MODELS: ModelInfo[] = [
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", vision: true },
  { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet", vision: true },
  { id: "openai/gpt-4o", name: "GPT-4o", vision: true },
  { id: "openai/gpt-4o-mini", name: "GPT-4o mini", vision: true },
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", vision: true },
  { id: "google/gemini-flash-1.5", name: "Gemini 1.5 Flash", vision: true },
];

export const DEFAULT_MODEL =
  process.env.NEXT_PUBLIC_OPENROUTER_MODEL || "anthropic/claude-sonnet-4";

// Pick a sensible default: the env model if present + vision-capable, else the
// strongest Claude Sonnet vision model, else any vision model.
export function pickDefaultModel(models: ModelInfo[], fallback = DEFAULT_MODEL): string {
  if (!models.length) return fallback;
  const byEnv = models.find((m) => m.id === fallback && m.vision);
  if (byEnv) return byEnv.id;
  const sonnet = models.find((m) => m.vision && /claude.*sonnet/i.test(m.id));
  if (sonnet) return sonnet.id;
  const anyVision = models.find((m) => m.vision);
  return anyVision?.id ?? models[0].id;
}
