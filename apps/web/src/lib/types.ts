// Shared UI types. Intentionally decoupled from Convex's generated Doc types so
// the fixtures preview can satisfy the same component props without a backend.

export type SessionStatus =
  | "idle"
  | "thinking"
  | "acting"
  | "waiting"
  | "done"
  | "failed";
export type StepKind = "navigate" | "type" | "click" | "extract" | "wait" | "verify";
export type StepStatus =
  | "queued"
  | "pending"
  | "running"
  | "success"
  | "recover"
  | "failed";
export type CharState = "idle" | "thinking" | "acting" | "recover" | "done";
export type Phase = "empty" | "running" | "done";

export interface ResultRow {
  icon: string;
  k: string;
  v: string;
  note?: string;
  mono?: boolean;
}
export interface SessionResult {
  title: string;
  sub: string;
  rows: ResultRow[];
}

export interface HighlightRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SessionDoc {
  _id: string;
  prompt: string;
  model: string;
  status: SessionStatus;
  intro?: string;
  summary?: string;
  result?: SessionResult;
  createdAt: number;
}

export interface StepDoc {
  _id: string;
  sessionId: string;
  index: number;
  kind: StepKind;
  label: string;
  thought?: string;
  status: StepStatus;
  recoverNote?: string;
  ts: number;
}

export interface FrameDoc {
  _id: string;
  sessionId: string;
  stepIndex: number;
  screenshotUrl: string | null;
  url: { host: string; path: string };
  highlightRect?: HighlightRect;
  viewportW: number;
  viewportH: number;
  ts: number;
}

export interface MessageDoc {
  _id: string;
  sessionId: string;
  role: "user" | "agent";
  text: string;
  result?: SessionResult; // present on a completed turn's agent message
  ts: number;
}

// ── Tweaks ───────────────────────────────────────────────────────────────────
export type PillStyle = "glow" | "minimal" | "plain";
export type Density = "compact" | "expanded";
export interface Tweaks {
  density: Density;
  pillStyle: PillStyle;
  accent: string;
  speed: number;
}
export const TWEAK_DEFAULTS: Tweaks = {
  density: "expanded",
  pillStyle: "glow",
  accent: "#6e6bf2",
  speed: 1,
};

// ── Models ───────────────────────────────────────────────────────────────────
export interface ModelInfo {
  id: string;
  name: string;
  vision: boolean;
}
