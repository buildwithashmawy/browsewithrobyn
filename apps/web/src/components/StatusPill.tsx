import type { PillStyle } from "@/lib/types";

const LABELS: Record<string, string> = {
  idle: "Idle",
  thinking: "Thinking",
  acting: "Acting",
  waiting: "Waiting for you",
  done: "Done",
  failed: "Stopped",
};

export function StatusPill({
  state,
  styleName,
}: {
  state: string;
  styleName: PillStyle;
}) {
  return (
    <div className={`pill style-${styleName}`} data-state={state}>
      <span className="pill-dot" />
      <span className="pill-bars">
        <i />
        <i />
        <i />
      </span>
      {LABELS[state] ?? "Idle"}
    </div>
  );
}
