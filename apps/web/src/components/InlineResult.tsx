import { Icon, hasIcon } from "./Icon";
import type { SessionResult } from "@/lib/types";

// Compact result card kept inline in the conversation thread (one per completed
// turn). The full ResultCard still slides up over the browser for the latest.
export function InlineResult({ result }: { result: SessionResult }) {
  return (
    <div className="result-inline">
      <div className="result-head">
        <div className="result-badge">
          <Icon name="check" size={19} />
        </div>
        <div>
          <div className="result-title">{result.title}</div>
          <div className="result-sub">{result.sub}</div>
        </div>
      </div>
      <div className="detail-rows">
        {result.rows.map((row, i) => (
          <div className="detail-row" key={i}>
            <span className="k">
              <span style={{ color: "var(--text-3)", display: "grid", placeItems: "center" }}>
                <Icon name={hasIcon(row.icon) ? row.icon : "check"} size={15} />
              </span>
              {row.k}
            </span>
            <span className={"v" + (row.mono ? " mono" : "")}>
              {row.v}
              {row.note ? (
                <span style={{ color: "var(--amber)", fontWeight: 500, marginLeft: 8, fontSize: 11 }}>
                  · {row.note}
                </span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
