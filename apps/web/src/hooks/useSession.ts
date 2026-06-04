"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/api";
import type { Doc, Id } from "@convex/dataModel";
import type { FrameDoc, MessageDoc, SessionDoc, StepDoc } from "@/lib/types";

// Subscribe to the live session, its steps, and the latest frame.
export function useSession(sessionId: string | null) {
  const sid = (sessionId ?? undefined) as Id<"sessions"> | undefined;
  const session = useQuery(api.sessions.get, sid ? { sessionId: sid } : "skip");
  const steps = useQuery(api.steps.list, sid ? { sessionId: sid } : "skip");
  const frame = useQuery(api.frames.latest, sid ? { sessionId: sid } : "skip");
  const messages = useQuery(api.messages.list, sid ? { sessionId: sid } : "skip");

  return {
    session: session ? toSession(session) : null,
    steps: (steps ?? []).map(toStep),
    frame: frame ? toFrame(frame) : null,
    messages: (messages ?? []).map(toMessage),
  };
}

function toMessage(d: Doc<"messages">): MessageDoc {
  return {
    _id: d._id,
    sessionId: d.sessionId,
    role: d.role,
    text: d.text,
    result: d.result,
    ts: d.ts,
  };
}

function toSession(d: Doc<"sessions">): SessionDoc {
  return {
    _id: d._id,
    prompt: d.prompt,
    model: d.model,
    status: d.status,
    intro: d.intro,
    summary: d.summary,
    result: d.result,
    createdAt: d.createdAt,
  };
}

function toStep(d: Doc<"steps">): StepDoc {
  return {
    _id: d._id,
    sessionId: d.sessionId,
    index: d.index,
    kind: d.kind,
    label: d.label,
    thought: d.thought,
    status: d.status,
    recoverNote: d.recoverNote,
    ts: d.ts,
  };
}

function toFrame(d: Doc<"frames"> & { screenshotUrl: string | null }): FrameDoc {
  return {
    _id: d._id,
    sessionId: d.sessionId,
    stepIndex: d.stepIndex,
    screenshotUrl: d.screenshotUrl,
    url: d.url,
    highlightRect: d.highlightRect,
    viewportW: d.viewportW,
    viewportH: d.viewportH,
    ts: d.ts,
  };
}
