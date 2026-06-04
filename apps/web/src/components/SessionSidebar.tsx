"use client";

import { Icon } from "./Icon";
import type { CSSProperties } from "react";
import type { SessionSummary } from "@/hooks/useSessionsList";

const LABEL: Record<string, string> = {
  idle: "Queued",
  thinking: "Running",
  acting: "Running",
  done: "Done",
  failed: "Stopped",
};

function rel(ts: number): string {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Indicator({ status }: { status: string }) {
  if (status === "done")
    return (
      <span className="check">
        <Icon name="check" size={14} />
      </span>
    );
  if (status === "failed")
    return (
      <span className="warn">
        <Icon name="warn" size={14} />
      </span>
    );
  if (status === "thinking" || status === "acting") return <span className="spinner" />;
  return <span className="dot" />;
}

export function SessionSidebar({
  open,
  sessions,
  activeId,
  onSelect,
  onNew,
  onCollapse,
}: {
  open: boolean;
  sessions: SessionSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onCollapse: () => void;
}) {
  return (
    <>
      {open ? <div className="sidebar-backdrop" onClick={onCollapse} /> : null}
      <aside className="sidebar" data-open={open} aria-hidden={!open}>
      <div className="sidebar-inner">
        <div className="sidebar-head">
          <span className="sidebar-title">Tasks</span>
          <button
            className="icon-btn"
            style={{ width: 26, height: 26 }}
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            title="Collapse"
          >
            <Icon name="chevron" size={15} style={{ transform: "rotate(90deg)" } as CSSProperties} />
          </button>
        </div>

        <button className="new-task" onClick={onNew}>
          <Icon name="plus" size={15} />
          New task
        </button>

        <div className="sidebar-list scroll">
          {sessions.length === 0 ? (
            <div className="sidebar-empty">
              No tasks yet.
              <br />
              Start one from the composer.
            </div>
          ) : (
            sessions.map((s) => (
              <button
                key={s._id}
                className="sess-card"
                data-active={s._id === activeId}
                onClick={() => onSelect(s._id)}
                title={s.prompt}
              >
                <span className="sess-ind">
                  <Indicator status={s.status} />
                </span>
                <span className="sess-body">
                  <span className="sess-prompt">{s.prompt}</span>
                  <span className="sess-meta">
                    {LABEL[s.status] ?? "Idle"} · {rel(s.createdAt)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
    </>
  );
}
