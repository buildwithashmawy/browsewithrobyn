import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { highlightRect } from "./schema";

// Agent: get a short-lived upload URL, POST the screenshot bytes to it, receive a storageId.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

// Agent: record a frame (screenshot + url + highlight box) for a step.
export const add = mutation({
  args: {
    sessionId: v.id("sessions"),
    stepIndex: v.number(),
    storageId: v.id("_storage"),
    url: v.object({ host: v.string(), path: v.string() }),
    highlightRect: v.optional(highlightRect),
    viewportW: v.number(),
    viewportH: v.number(),
  },
  handler: async (ctx, args) =>
    await ctx.db.insert("frames", { ...args, ts: Date.now() }),
});

// Web subscribes — the most recent frame drives the live browser view.
// Resolves the storageId to a served URL so the client binds <img src> directly.
export const latest = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const frame = await ctx.db
      .query("frames")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .first();
    if (!frame) return null;
    const screenshotUrl = await ctx.storage.getUrl(frame.storageId);
    return { ...frame, screenshotUrl };
  },
});
