import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ── Shared validators (imported by the function files) ───────────────────────
export const sessionStatus = v.union(
  v.literal("idle"),
  v.literal("thinking"),
  v.literal("acting"),
  v.literal("waiting"), // paused, awaiting a reply from the user
  v.literal("done"),
  v.literal("failed"),
);

export const stepKind = v.union(
  v.literal("navigate"),
  v.literal("type"),
  v.literal("click"),
  v.literal("extract"),
  v.literal("wait"),
  v.literal("verify"),
);

export const stepStatus = v.union(
  v.literal("queued"),
  v.literal("pending"),
  v.literal("running"),
  v.literal("success"),
  v.literal("recover"),
  v.literal("failed"),
);

export const resultValidator = v.object({
  title: v.string(),
  sub: v.string(),
  rows: v.array(
    v.object({
      icon: v.string(),
      k: v.string(),
      v: v.string(),
      note: v.optional(v.string()),
      mono: v.optional(v.boolean()),
    }),
  ),
});

export const highlightRect = v.object({
  x: v.number(),
  y: v.number(),
  w: v.number(),
  h: v.number(),
});

// ── Schema ───────────────────────────────────────────────────────────────────
export default defineSchema({
  sessions: defineTable({
    prompt: v.string(),
    model: v.string(),
    status: sessionStatus,
    intro: v.optional(v.string()), // HTML (may contain <b>…</b>)
    summary: v.optional(v.string()), // HTML
    result: v.optional(resultValidator),
    createdAt: v.number(),
  }),

  // append-only action log; mirrors the design's RUN.steps shape exactly
  steps: defineTable({
    sessionId: v.id("sessions"),
    index: v.number(),
    kind: stepKind,
    label: v.string(),
    thought: v.optional(v.string()), // mono detail; may contain <span class="tk*">
    status: stepStatus,
    recoverNote: v.optional(v.string()),
    ts: v.number(),
  }).index("by_session", ["sessionId", "index"]),

  // latest frame drives the live browser view
  frames: defineTable({
    sessionId: v.id("sessions"),
    stepIndex: v.number(),
    storageId: v.id("_storage"), // screenshot bytes in Convex file storage
    url: v.object({ host: v.string(), path: v.string() }),
    highlightRect: v.optional(highlightRect), // agent-space (CSS px) box of the acted element
    viewportW: v.number(), // agent CSS viewport size — overlay scales against this
    viewportH: v.number(),
    ts: v.number(),
  }).index("by_session", ["sessionId", "ts"]),

  // follow-up conversation turns (the initial prompt stays on the session)
  messages: defineTable({
    sessionId: v.id("sessions"),
    role: v.union(v.literal("user"), v.literal("agent")),
    text: v.string(),
    result: v.optional(resultValidator), // a completed turn's result card
    ts: v.number(),
  }).index("by_session", ["sessionId", "ts"]),
});
