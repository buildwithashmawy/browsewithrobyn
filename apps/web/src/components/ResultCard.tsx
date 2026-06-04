import { Icon, hasIcon } from "./Icon";
import type { SessionResult } from "@/lib/types";

export function ResultCard({
  result,
  finalUrl,
  finalShot,
  onReplay,
}: {
  result: SessionResult;
  finalUrl?: string;
  finalShot?: string;
  onReplay: () => void;
}) {
  return (
    <div className="result-scrim">
      <div className="result-card">
        <div className="result-head">
          <div className="result-badge">
            <Icon name="check" size={22} />
          </div>
          <div>
            <div className="result-title">{result.title}</div>
            <div className="result-sub">{result.sub}</div>
          </div>
        </div>

        <div className="result-detail">
          <div className="result-thumb">
            {finalShot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="shot-final" src={finalShot} alt="Final screenshot" />
            ) : (
              <>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                      "repeating-linear-gradient(135deg, var(--mock-surface) 0 14px, rgba(0,0,0,0.05) 14px 28px)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%,-50%)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-3)",
                    letterSpacing: "0.05em",
                  }}
                >
                  [ final screenshot ]
                </div>
              </>
            )}
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
                    <span
                      style={{
                        color: "var(--amber)",
                        fontWeight: 500,
                        marginLeft: 8,
                        fontSize: 11,
                      }}
                    >
                      · {row.note}
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="result-actions">
          <button className="btn" onClick={onReplay}>
            <Icon name="replay" size={15} />
            New task
          </button>
          {finalUrl ? (
            <a
              className="btn primary"
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="external" size={15} />
              Open page
            </a>
          ) : (
            <button className="btn primary">
              <Icon name="share" size={15} />
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
