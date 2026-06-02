import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { resultValidator } from "./schema";

// Web subscribes — follow-up turns in a session's conversation, oldest first.
export const list = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) =>
    await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect(),
});

// Web appends a user follow-up; the agent appends its replies/questions.
export const add = mutation({
  args: {
    sessionId: v.id("sessions"),
    role: v.union(v.literal("user"), v.literal("agent")),
    text: v.string(),
    result: v.optional(resultValidator),
  },
  handler: async (ctx, args) =>
    await ctx.db.insert("messages", { ...args, ts: Date.now() }),
});
