import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { stepKind, stepStatus } from "./schema";

// Web subscribes — ordered by the by_session index ([sessionId, index]).
export const list = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) =>
    await ctx.db
      .query("steps")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect(),
});

// Agent appends a step when it begins acting on it.
export const append = mutation({
  args: {
    sessionId: v.id("sessions"),
    index: v.number(),
    kind: stepKind,
    label: v.string(),
    thought: v.optional(v.string()),
    status: stepStatus,
    recoverNote: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    await ctx.db.insert("steps", { ...args, ts: Date.now() }),
});

// Agent transitions a step's status (running → success | recover | failed).
export const setStatus = mutation({
  args: {
    stepId: v.id("steps"),
    status: stepStatus,
    recoverNote: v.optional(v.string()),
  },
  handler: async (ctx, { stepId, status, recoverNote }) => {
    await ctx.db.patch(stepId, {
      status,
      ...(recoverNote !== undefined ? { recoverNote } : {}),
    });
  },
});
