"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { BrowserPanel } from "@/components/BrowserPanel";
import { useTheme } from "@/hooks/useTheme";
import { deriveView } from "@/lib/deriveView";
import { FIXTURE, fixtureFrame } from "@/lib/fixtures";
import type {
  ModelInfo,
  SessionDoc,
  SessionStatus,
  StepDoc,
  StepStatus,
} from "@/lib/types";

const PREVIEW_MODELS: ModelInfo[] = [
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", vision: true },
  { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet", vision: true },
  { id: "openai/gpt-4o", name: "GPT-4o", vision: true },
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", vision: true },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B (text)", vision: false },
];

const THINKING_KINDS = new Set(["navigate", "wait", "extract", "verify"]);

// /preview replays the fixture through the real components — no backend, no keys.
export default function PreviewPage() {
  const { theme, toggle } = useTheme();
  const [model, setModel] = useState(PREVIEW_MODELS[0].id);

  const [started, setStarted] = useState(false);
  const [statuses, setStatuses] = useState<StepStatus[]>([]);
  const [visible, setVisible] = useState(0);
  const [frameIdx, setFrameIdx] = useState<number | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [showResult, setShowResult] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const speed = 1;

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  useEffect(() => () => clear(), [clear]);

  const runStep = useCallback(
    (i: number) => {
      const T = (ms: number, fn: () => void) =>
        timers.current.push(setTimeout(fn, ms / speed));
      const step = FIXTURE.steps[i];
      setVisible(i + 1);
      setStatuses((prev) => {
        const n = prev.slice();
        n[i] = "running";
        return n;
      });
      setFrameIdx(i);
      setSessionStatus(THINKING_KINDS.has(step.kind) ? "thinking" : "acting");
      T(step.dur, () => {
        setStatuses((prev) => {
          const n = prev.slice();
          n[i] = step.recoverNote ? "recover" : "success";
          return n;
        });
        if (i + 1 < FIXTURE.steps.length) {
          T(220, () => runStep(i + 1));
        } else {
          setSessionStatus("done");
          T(550, () => setShowResult(true));
        }
      });
    },
    [speed],
  );

  const start = useCallback(() => {
    clear();
    setStarted(true);
    setStatuses(FIXTURE.steps.map(() => "queued"));
    setVisible(0);
    setShowResult(false);
    setFrameIdx(null);
    setSessionStatus("thinking");
    timers.current.push(setTimeout(() => runStep(0), 480 / speed));
  }, [clear, runStep, speed]);

  const reset = useCallback(() => {
    clear();
    setStarted(false);
    setShowResult(false);
    setFrameIdx(null);
    setVisible(0);
    setSessionStatus("idle");
  }, [clear]);

  const session: SessionDoc | null = started
    ? {
        _id: "preview",
        prompt: FIXTURE.prompt,
        model,
        status: sessionStatus,
        intro: FIXTURE.intro,
        summary: sessionStatus === "done" ? FIXTURE.summary : undefined,
        result: showResult ? FIXTURE.result : undefined,
        createdAt: 0,
      }
    : null;

  const steps: StepDoc[] = FIXTURE.steps.slice(0, visible).map((s, i) => ({
    _id: `step-${i}`,
    sessionId: "preview",
    index: s.index,
    kind: s.kind,
    label: s.label,
    thought: s.thought,
    status: statuses[i] ?? "queued",
    recoverNote: statuses[i] === "recover" ? s.recoverNote : undefined,
    ts: i,
  }));

  const frame = frameIdx !== null ? fixtureFrame(frameIdx) : null;
  const view = deriveView(session, steps);
  const showResultCard = view.phase === "done" && showResult && sessionStatus === "done";

  return (
    <div className="app">
      <ChatPanel
        phase={view.phase}
        session={session}
        steps={steps}
        messages={[]}
        agentStatus={view.agentStatus}
        charState={view.charState}
        density="expanded"
        pillStyle="minimal"
        theme={theme}
        onToggleTheme={toggle}
        models={PREVIEW_MODELS}
        modelsLoading={false}
        selectedModel={model}
        onSelectModel={setModel}
        onSend={() => start()}
        onStop={() => {
          clear();
          setSessionStatus("failed");
        }}
        onRetry={() => start()}
        running={view.running}
      />
      <BrowserPanel
        frame={frame}
        result={FIXTURE.result}
        showResult={showResultCard}
        onReplay={reset}
        running={view.running}
      />
    </div>
  );
}
