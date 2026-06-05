"use client";

import { RobynCharacter } from "./RobynCharacter";
import { ThemeToggle } from "./ThemeToggle";
import { ModelPicker } from "./ModelPicker";
import { EmptyState } from "./EmptyState";
import { Thread } from "./Thread";
import { Composer } from "./Composer";
import { Icon } from "./Icon";
import type {
  CharState,
  Density,
  MessageDoc,
  ModelInfo,
  Phase,
  PillStyle,
  SessionDoc,
  StepDoc,
} from "@/lib/types";

export interface ChatPanelProps {
  phase: Phase;
  session: SessionDoc | null;
  steps: StepDoc[];
  messages: MessageDoc[];
  agentStatus: string;
  charState: CharState;
  density: Density;
  pillStyle: PillStyle;
  theme: string;
  onToggleTheme: () => void;
  models: ModelInfo[];
  modelsLoading: boolean;
  selectedModel: string;
  onSelectModel: (id: string) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  onRetry: () => void;
  running: boolean;
  notice?: string | null;
  onToggleSidebar?: () => void;
}

export function ChatPanel({
  phase,
  session,
  steps,
  messages,
  agentStatus,
  charState,
  density,
  pillStyle,
  theme,
  onToggleTheme,
  models,
  modelsLoading,
  selectedModel,
  onSelectModel,
  onSend,
  onStop,
  onRetry,
  running,
  notice,
  onToggleSidebar,
}: ChatPanelProps) {
  return (
    <div className="left">
      <div className="left-head">
        {onToggleSidebar ? (
          <button
            className="icon-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle tasks sidebar"
            title="Tasks"
          >
            <Icon name="layers" size={17} />
          </button>
        ) : null}
        <div className="brand-mark">
          <RobynCharacter state={phase === "empty" ? "idle" : charState} size={30} />
        </div>
        <div className="brand-text">
          <div className="brand-name">Robyn</div>
          <div className="brand-sub">Autonomous browser agent</div>
        </div>
        <div className="head-spacer" />
        <ModelPicker
          models={models}
          value={selectedModel}
          onChange={onSelectModel}
          loading={modelsLoading}
          disabled={running}
        />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      {phase === "empty" || !session ? (
        <EmptyState onChip={onSend} />
      ) : (
        <Thread
          session={session}
          steps={steps}
          messages={messages}
          charState={charState}
          density={density}
          onRetry={onRetry}
        />
      )}

      {notice ? (
        <div className="agent-notice" role="alert">
          <Icon name="warn" size={14} />
          <span>{notice}</span>
          <button className="agent-notice-retry" onClick={onRetry} title="Try again">
            <Icon name="replay" size={13} />
            Retry
          </button>
        </div>
      ) : null}

      <Composer
        onSend={onSend}
        onStop={onStop}
        running={running}
        status={agentStatus}
        pillStyle={pillStyle}
      />
    </div>
  );
}
