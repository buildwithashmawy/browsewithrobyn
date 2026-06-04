import type { CSSProperties } from "react";
import type { CharState } from "@/lib/types";

// "Robyn" — the agent character (geometric squircle + orbiting scanner).
// Ported from the design's character.jsx; expression is driven by [data-state].
// All animation lives in globals.css (.character[data-state="…"]).

export function RobynCharacter({
  state = "idle",
  size = 64,
  className = "",
}: {
  state?: CharState;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={"character " + className}
      data-state={state}
      style={{ "--cs": `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <div className="character-inner">
        <svg viewBox="0 0 100 100">
          {/* orbiting scanner ring + dot */}
          <g className="orbit">
            <circle className="orbit-ring" cx={50} cy={50} r={45} strokeDasharray="3 14" />
            <circle className="orbit-dot-glow" cx={50} cy={5} r={5.5} />
            <circle className="orbit-dot" cx={50} cy={5} r={2.8} />
          </g>
          {/* body */}
          <rect className="body" x={22} y={24} width={56} height={52} rx={19} />
          <rect className="body-edge" x={22.5} y={24.5} width={55} height={51} rx={18.5} />
          {/* dimension */}
          <ellipse className="hl" cx={42} cy={38} rx={16} ry={9} />
          <ellipse className="shade" cx={50} cy={73} rx={22} ry={7} />
          {/* eyes */}
          <g className="eyes">
            <rect className="eye-pill left" x={37} y={44} width={7} height={15} rx={3.5} />
            <rect className="eye-pill right" x={56} y={44} width={7} height={15} rx={3.5} />
            <path className="eye-happy left" d="M34 54 Q40.5 47 47 54" />
            <path className="eye-happy right" d="M53 54 Q59.5 47 66 54" />
          </g>
          {/* success sparkles */}
          <g className="sparkles">
            <circle cx={82} cy={26} r={2.6} />
            <circle cx={18} cy={34} r={2.2} />
            <circle cx={76} cy={64} r={1.9} />
          </g>
        </svg>
      </div>
    </div>
  );
}
