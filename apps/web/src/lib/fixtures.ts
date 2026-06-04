import type { FrameDoc, HighlightRect, SessionResult, StepKind } from "@/lib/types";

// A scripted run used by /preview to exercise every UI state without a backend
// or any API keys. Mirrors the live Convex data shapes exactly.

const VW = 1280;
const VH = 800;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&apos;");
}

// A lightweight SVG "screenshot" of a web page, 1280×800, so the highlight
// overlay can be verified against a real image with known dimensions.
function shot(title: string, host: string, accent = "#6e6bf2"): string {
  const parts: string[] = [];
  parts.push(`<rect width='${VW}' height='${VH}' fill='#ffffff'/>`);
  parts.push(`<rect width='${VW}' height='58' fill='#f1f3f6'/>`);
  parts.push(`<circle cx='32' cy='29' r='9' fill='${accent}'/>`);
  parts.push(`<rect x='50' y='22' width='${Math.min(120, host.length * 8)}' height='14' rx='4' fill='#c8ccd4'/>`);
  parts.push(`<rect x='${VW - 250}' y='23' width='56' height='12' rx='4' fill='#d8dbe2'/>`);
  parts.push(`<rect x='${VW - 174}' y='23' width='56' height='12' rx='4' fill='#d8dbe2'/>`);
  parts.push(`<circle cx='${VW - 40}' cy='29' r='12' fill='#dfe2e8'/>`);
  parts.push(
    `<text x='80' y='126' font-family='Inter, Arial, sans-serif' font-size='30' font-weight='700' fill='#15181f'>${escapeXml(title)}</text>`,
  );
  for (let i = 0; i < 5; i++) {
    const y = 170 + i * 84;
    parts.push(`<rect x='80' y='${y}' width='${VW - 160}' height='64' rx='12' fill='#f7f8fa' stroke='#eceef2'/>`);
    parts.push(`<rect x='104' y='${y + 16}' width='${280 + ((i * 67) % 360)}' height='13' rx='4' fill='#c4c9d2'/>`);
    parts.push(`<rect x='104' y='${y + 38}' width='${170 + ((i * 53) % 300)}' height='10' rx='4' fill='#dde0e6'/>`);
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${VW}' height='${VH}' viewBox='0 0 ${VW} ${VH}'>${parts.join("")}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const rowRect = (i: number): HighlightRect => ({ x: 80, y: 170 + i * 84, w: VW - 160, h: 64 });

export interface FixtureStep {
  index: number;
  kind: StepKind;
  label: string;
  thought: string;
  recoverNote?: string; // present → this step ends in the amber "recover" state
  dur: number;
  url: { host: string; path: string };
  highlightRect?: HighlightRect;
}

export const FIXTURE = {
  prompt: "Summarize this weekend's weather in San Francisco",
  model: "anthropic/claude-sonnet-4",
  intro:
    "On it — I'll check this weekend's <b>San Francisco</b> forecast and pull together a short summary.",
  summary:
    "This weekend in <b>San Francisco</b>: <b>Saturday 64°F &amp; sunny</b>, <b>Sunday 61°F partly cloudy</b>. Light winds and no rain expected — a good one to be outside.",
  steps: [
    {
      index: 0,
      kind: "navigate",
      label: "Navigating to Google",
      thought:
        '<span class="tk-accent">GET</span> https://www.google.com\n<span class="tk-ok">200 OK</span> · document ready in 0.4s',
      dur: 1400,
      url: { host: "www.google.com", path: "/" },
      highlightRect: rowRect(0),
    },
    {
      index: 1,
      kind: "type",
      label: 'Searching "San Francisco weekend weather"',
      thought:
        'focus <span class="tk">input[name="q"]</span>\ntype → "san francisco weekend weather"',
      dur: 1500,
      url: { host: "www.google.com", path: "/" },
      highlightRect: rowRect(0),
    },
    {
      index: 2,
      kind: "click",
      label: "Opening the weather panel",
      thought:
        'click <span class="tk">div[role="link"].weather</span>\n→ /search?q=san+francisco+weather',
      dur: 1300,
      url: { host: "www.google.com", path: "/search?q=sf+weather" },
      highlightRect: rowRect(1),
    },
    {
      index: 3,
      kind: "wait",
      label: "Waiting for the 7-day forecast",
      thought:
        'await <span class="tk">networkidle</span> …\n<span class="tk-amber">timeout</span> — forecast panel was slow',
      recoverNote: "Forecast was slow to load — re-observing and retrying",
      dur: 1700,
      url: { host: "www.google.com", path: "/search?q=sf+weather" },
      highlightRect: rowRect(2),
    },
    {
      index: 4,
      kind: "extract",
      label: "Reading Saturday & Sunday",
      thought:
        'parsed forecast cards\nSat → <span class="tk-accent">64°F</span> sunny · Sun → <span class="tk-accent">61°F</span> partly cloudy',
      dur: 1600,
      url: { host: "www.google.com", path: "/search?q=sf+weather" },
      highlightRect: rowRect(3),
    },
    {
      index: 5,
      kind: "verify",
      label: "Weekend summary ready",
      thought:
        '<span class="tk-ok">done</span>\ncompiled a 2-day summary from the forecast',
      dur: 1300,
      url: { host: "www.google.com", path: "/search?q=sf+weather" },
    },
  ] as FixtureStep[],
  result: {
    title: "Weekend weather — San Francisco",
    sub: "Sat–Sun · mostly sunny",
    rows: [
      { icon: "sun", k: "Saturday", v: "64°F · Sunny" },
      { icon: "sun", k: "Sunday", v: "61°F · Partly cloudy" },
      { icon: "clock", k: "Updated", v: "Today, 9:41 AM" },
      { icon: "pin", k: "Location", v: "San Francisco, CA" },
    ],
  } satisfies SessionResult,
};

// Build the frame shown while a given step is active.
export function fixtureFrame(stepIndex: number): FrameDoc {
  const step = FIXTURE.steps[Math.min(stepIndex, FIXTURE.steps.length - 1)];
  const title =
    step.url.path === "/" ? "Google" : "san francisco weather — Google Search";
  return {
    _id: `frame-${stepIndex}`,
    sessionId: "preview",
    stepIndex,
    screenshotUrl: shot(title, step.url.host),
    url: step.url,
    highlightRect: step.highlightRect,
    viewportW: VW,
    viewportH: VH,
    ts: stepIndex,
  };
}
