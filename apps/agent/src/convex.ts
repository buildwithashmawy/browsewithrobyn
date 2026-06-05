import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import type { Id } from "../../../convex/_generated/dataModel";
import { config } from "./config";

// The generated `api` is just `anyApi` at runtime; using it directly avoids
// importing the generated api.js (ESM-in-CJS-scope) under tsx/Node.
const api = anyApi;

export type SessionStatus =
  | "idle"
  | "thinking"
  | "acting"
  | "waiting"
  | "done"
  | "failed";
export type StepStatus = "queued" | "pending" | "running" | "success" | "recover" | "failed";
export type StepKind = "navigate" | "type" | "click" | "extract" | "wait" | "verify";

export interface ResultRow {
  icon: string;
  k: string;
  v: string;
  note?: string;
  mono?: boolean;
}
export interface SessionPatch {
  status?: SessionStatus;
  intro?: string;
  summary?: string;
  result?: { title: string; sub: string; rows: ResultRow[] };
  model?: string;
}

export interface HighlightRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class ConvexWriter {
  private client = new ConvexHttpClient(config.convexUrl);

  getSession(id: string) {
    return this.client.query(api.sessions.get, { sessionId: id as Id<"sessions"> });
  }

  listSteps(id: string): Promise<Array<{ index: number }>> {
    return this.client.query(api.steps.list, { sessionId: id as Id<"sessions"> });
  }

  getMessages(
    id: string,
  ): Promise<Array<{ role: "user" | "agent"; text: string; ts: number }>> {
    return this.client.query(api.messages.list, { sessionId: id as Id<"sessions"> });
  }

  addMessage(
    id: string,
    role: "user" | "agent",
    text: string,
    result?: { title: string; sub: string; rows: ResultRow[] },
  ) {
    return this.client.mutation(api.messages.add, {
      sessionId: id as Id<"sessions">,
      role,
      text,
      ...(result ? { result } : {}),
    });
  }

  patchSession(id: string, patch: SessionPatch) {
    return this.client.mutation(api.sessions.patch, {
      sessionId: id as Id<"sessions">,
      patch,
    });
  }

  appendStep(args: {
    sessionId: string;
    index: number;
    kind: StepKind;
    label: string;
    thought?: string;
    status: StepStatus;
    recoverNote?: string;
  }): Promise<Id<"steps">> {
    return this.client.mutation(api.steps.append, {
      ...args,
      sessionId: args.sessionId as Id<"sessions">,
    });
  }

  setStep(stepId: Id<"steps">, status: StepStatus, recoverNote?: string) {
    return this.client.mutation(api.steps.setStatus, { stepId, status, recoverNote });
  }

  async addFrame(args: {
    sessionId: string;
    stepIndex: number;
    screenshot: Buffer;
    url: { host: string; path: string };
    highlightRect?: HighlightRect;
    viewportW: number;
    viewportH: number;
  }) {
    if (!args.screenshot.length) return;
    const uploadUrl: string = await this.client.mutation(api.frames.generateUploadUrl, {});
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "image/jpeg" },
      body: new Uint8Array(args.screenshot),
    });
    const { storageId } = (await res.json()) as { storageId: string };
    await this.client.mutation(api.frames.add, {
      sessionId: args.sessionId as Id<"sessions">,
      stepIndex: args.stepIndex,
      storageId: storageId as Id<"_storage">,
      url: args.url,
      highlightRect: args.highlightRect,
      viewportW: args.viewportW,
      viewportH: args.viewportH,
    });
  }
}
