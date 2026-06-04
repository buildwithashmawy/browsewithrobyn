"use client";

import { useEffect, useRef } from "react";
import { RobynCharacter } from "./RobynCharacter";
import { StepCard } from "./StepCard";
import { InlineResult } from "./InlineResult";
import { Icon } from "./Icon";
import type {
  CharState,
  Density,
  MessageDoc,
  SessionDoc,
  SessionResult,
  StepDoc,
} from "@/lib/types";

type Block =
  | { type: "steps"; key: string; steps: StepDoc[] }
  | { type: "user"; key: string; text: string }
  | { type: "agent"; key: string; text: string; result?: SessionResult };

// Merge steps + follow-up messages into one chronological timeline, grouping
// contiguous steps together (so they keep the indented step-stack look).
function buildBlocks(steps: StepDoc[], messages: MessageDoc[]): Block[] {
  const items = [
    ...steps.map((s) => ({ ts: s.ts, kind: "step" as const, step: s })),
    ...messages.map((m) => ({ ts: m.ts, kind: "msg" as const, msg: m })),
  ].sort((a, b) => a.ts - b.ts);

  const blocks: Block[] = [];
  let group: StepDoc[] = [];
  const flush = () => {
    if (group.length) {
      blocks.push({ type: "steps", key: `steps-${group[0]._id}`, steps: group });
      group = [];
    }
  };
  for (const it of items) {
    if (it.kind === "step") {
      group.push(it.step);
    } else {
      flush();
      if (it.msg.role === "agent") {
        blocks.push({ type: "agent", key: it.msg._id, text: it.msg.text, result: it.msg.result });
      } else {
        blocks.push({ type: "user", key: it.msg._id, text: it.msg.text });
      }
    }
  }
  flush();
  return blocks;
}

export function Thread({
  session,
  steps,
  messages,
  charState,
  density,
  onRetry,
}: {
  session: SessionDoc;
  steps: StepDoc[];
  messages: MessageDoc[];
  charState: CharState;
  density: Density;
  onRetry: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // keep pinned to the newest row as content streams in
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  });

  const blocks = buildBlocks(steps, messages);

  return (
    <div className="thread scroll" ref={ref}>
      <div className="msg-user">{session.prompt}</div>

      {session.intro ? (
        <div className="agent-line">
          <div className="agent-avatar">
            <RobynCharacter state={charState} size={28} />
          </div>
          <div className="agent-text" dangerouslySetInnerHTML={{ __html: session.intro }} />
        </div>
      ) : null}

      {blocks.map((b) =>
        b.type === "steps" ? (
          <div className="steps" key={b.key}>
            {b.steps.map((s) => (
              <StepCard key={s._id} step={s} density={density} />
            ))}
          </div>
        ) : b.type === "user" ? (
          <div className="msg-user" key={b.key}>
            {b.text}
          </div>
        ) : (
          <div className="agent-line" key={b.key}>
            <div className="agent-avatar">
              <RobynCharacter state={charState} size={28} />
            </div>
            <div className="agent-col">
              {/* agent messages are agent-authored (may contain <b>…</b>) */}
              <div className="agent-text" dangerouslySetInnerHTML={{ __html: b.text }} />
              {b.result ? <InlineResult result={b.result} /> : null}
            </div>
          </div>
        ),
      )}

      {session.status === "failed" ? (
        <div className="retry-row">
          <button className="retry-btn" onClick={onRetry} title="Retry this task">
            <Icon name="replay" size={14} />
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
