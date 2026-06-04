import type { CharState, Phase, SessionDoc, SessionStatus, StepDoc } from "@/lib/types";

export interface DerivedView {
  phase: Phase;
  agentStatus: SessionStatus; // drives the status pill (idle|thinking|acting|done|failed)
  charState: CharState; // drives the Robyn character expression
  running: boolean;
}

// Replaces the prototype's scripted timer state machine: derive the design's
// playback state purely from the live session + steps rows.
export function deriveView(
  session: SessionDoc | null | undefined,
  steps: StepDoc[],
): DerivedView {
  if (!session) {
    return { phase: "empty", agentStatus: "idle", charState: "idle", running: false };
  }

  const status = session.status;
  const phase: Phase = status === "done" || status === "failed" ? "done" : "running";
  const running = status === "idle" || status === "thinking" || status === "acting";

  const latest = steps.length ? steps[steps.length - 1] : undefined;
  const currentlyRecovering = running && latest?.status === "recover";

  let charState: CharState;
  if (status === "failed") charState = "recover";
  else if (status === "done") charState = "done";
  else if (currentlyRecovering) charState = "recover";
  else if (status === "thinking") charState = "thinking";
  else if (status === "acting") charState = "acting";
  else if (status === "waiting") charState = "thinking";
  else charState = "idle";

  return { phase, agentStatus: status, charState, running };
}

export function hexToRgb(hex: string): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(", ");
}
