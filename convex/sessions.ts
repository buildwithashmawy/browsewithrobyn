import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { resultValidator, sessionStatus } from "./schema";

// Web creates the session (so it can subscribe immediately), then hands the id to the agent.
export const create = mutation({
  args: { prompt: v.string(), model: v.string() },
  handler: async (ctx, { prompt, model }) => {
    return await ctx.db.insert("sessions", {
      prompt,
      model,
      status: "idle",
      createdAt: Date.now(),
    });
  },
});

// Web subscribes to this.
export const get = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => await ctx.db.get(sessionId),
});

// Recent sessions (newest first) for the history switcher.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("sessions").order("desc").take(30);
    return rows.map((r) => ({
      _id: r._id,
      prompt: r.prompt,
      status: r.status,
      createdAt: r.createdAt,
    }));
  },
});

// Agent patches status / intro / summary / result as the run progresses.
export const patch = mutation({
  args: {
    sessionId: v.id("sessions"),
    patch: v.object({
      status: v.optional(sessionStatus),
      intro: v.optional(v.string()),
      summary: v.optional(v.string()),
      result: v.optional(resultValidator),
      model: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { sessionId, patch }) => {
    await ctx.db.patch(sessionId, patch);
  },
});
