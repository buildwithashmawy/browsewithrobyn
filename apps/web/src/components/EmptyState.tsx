import { RobynCharacter } from "./RobynCharacter";
import { Icon } from "./Icon";
import { EXAMPLES } from "@/lib/examples";

export function EmptyState({ onChip }: { onChip: (text: string) => void }) {
  return (
    <div className="empty">
      <div className="empty-hero">
        <RobynCharacter state="idle" size={92} />
      </div>
      <h1 className="empty-title">What should I do for you?</h1>
      <p className="empty-sub">
        I&apos;m <b>Robyn</b>. Describe a task in plain English and I&apos;ll drive a
        real browser <b>step by step</b> — showing every action as I go.
      </p>
      <div className="chips">
        <div className="chips-label">Try one of these</div>
        {EXAMPLES.map((ex, i) => (
          <button
            key={i}
            className="chip"
            style={{ animationDelay: `${0.15 + i * 0.07}s` }}
            onClick={() => onChip(ex.text)}
          >
            <span className="chip-ico">
              <Icon name={ex.icon} size={17} />
            </span>
            <span>{ex.text}</span>
            <span className="chip-arrow">
              <Icon name="arrow" size={15} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
