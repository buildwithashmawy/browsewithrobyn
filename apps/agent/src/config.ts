import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Tiny dependency-free .env loader (apps/agent/.env), since tsx doesn't auto-load it.
function loadDotenv() {
  const here = dirname(fileURLToPath(import.meta.url)); // src/
  const envPath = join(here, "..", ".env"); // apps/agent/.env
  if (!existsSync(envPath)) return;
  for (const raw of readFileSync(envPath, "utf8").split("\n")) {
    const m = raw.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadDotenv();

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example → apps/agent/.env and fill it in.`,
    );
  }
  return v;
}

export const config = {
  convexUrl: required("CONVEX_URL"),
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openrouterModel: process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4",
  // Cap output tokens — the structured tool responses are small, and an uncapped
  // request pre-authorizes the model's full max (64k), which a low-credit key can't afford.
  maxTokens: Number(process.env.MAX_TOKENS || 1024),
  port: Number(process.env.PORT || 8787),
  // undefined → Playwright's bundled Chromium; set PW_CHANNEL=chrome to use real Chrome (better stealth).
  pwChannel: process.env.PW_CHANNEL || undefined,
  // Headless by default — you watch the run via the app's live screenshot view,
  // and headless is far more reliable across environments. Set HEADLESS=0 for a window.
  headless: process.env.HEADLESS !== "0",
  // A real desktop-Chrome UA: the default headless "HeadlessChrome" UA is an instant
  // bot signal (e.g. Google CAPTCHAs it). Override via USER_AGENT.
  userAgent:
    process.env.USER_AGENT ||
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  globalStepCap: Number(process.env.GLOBAL_STEP_CAP || 24),
  perStepRetry: Number(process.env.PER_STEP_RETRY || 2),
  // Taller default so the screenshot fills the browser panel better (the panel is
  // roughly square; a 1.6:1 viewport letterboxed heavily). Tune via env.
  viewportW: Number(process.env.VIEWPORT_W || 1280),
  viewportH: Number(process.env.VIEWPORT_H || 1000),
  referer: process.env.OPENROUTER_REFERER || "http://localhost:3000",
  title: "Robyn",
} as const;

export function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
