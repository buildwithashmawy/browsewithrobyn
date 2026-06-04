"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { UrlBar } from "./UrlBar";
import { ResultCard } from "./ResultCard";
import { RobynCharacter } from "./RobynCharacter";
import { projectRect, useElementSize } from "@/hooks/useImageScale";
import type { FrameDoc, SessionResult } from "@/lib/types";

export function BrowserPanel({
  frame,
  result,
  showResult,
  onReplay,
  running,
}: {
  frame: FrameDoc | null;
  result?: SessionResult;
  showResult: boolean;
  onReplay: () => void;
  running: boolean;
}) {
  const [vpRef, vp] = useElementSize<HTMLDivElement>();
  const [navProgress, setNavProgress] = useState(0);
  const [clicking, setClicking] = useState(false);
  const lastFrame = useRef<string | null>(null);

  // animate the nav-progress bar + a cursor click-ring on each new frame
  useEffect(() => {
    if (!frame || frame._id === lastFrame.current) return;
    lastFrame.current = frame._id;
    setNavProgress(20);
    const hasBox = !!frame.highlightRect;
    const t1 = setTimeout(() => setNavProgress(70), 90);
    const t2 = setTimeout(() => setNavProgress(100), 280);
    const t3 = setTimeout(() => setNavProgress(0), 560);
    const c1 = hasBox ? setTimeout(() => setClicking(true), 300) : undefined;
    const c2 = hasBox ? setTimeout(() => setClicking(false), 760) : undefined;
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (c1) clearTimeout(c1);
      if (c2) clearTimeout(c2);
    };
  }, [frame]);

  const url = frame?.url ?? { host: "about:blank", path: "" };
  const loading = running && navProgress > 0 && navProgress < 100;
  const box =
    frame?.highlightRect && vp.w && vp.h
      ? projectRect(frame.highlightRect, frame.viewportW, frame.viewportH, vp.w, vp.h)
      : null;
  const cursor = box
    ? { left: box.left + box.width - 16, top: box.top + box.height - 14 }
    : { left: "50%", top: "60%" };
  const finalUrl = frame ? `https://${frame.url.host}${frame.url.path}` : undefined;

  return (
    <div className="right">
      <div className="browser">
        <div
          className="nav-progress"
          style={{
            width: `${navProgress || 0}%`,
            opacity: navProgress > 0 && navProgress < 100 ? 1 : 0,
          }}
        />
        <div className="chrome">
          <div className="traffic">
            <i className="r" />
            <i className="y" />
            <i className="g" />
          </div>
          <div className="nav-btns">
            <div className="nb">
              <Icon name="back" size={16} />
            </div>
            <div className="nb">
              <Icon name="fwd" size={16} />
            </div>
            <div className="nb">
              <Icon name="refresh" size={15} />
            </div>
          </div>
          <UrlBar url={url} loading={loading} />
        </div>

        <div className="viewport" ref={vpRef}>
          {frame?.screenshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={frame._id} className="shot" src={frame.screenshotUrl} alt="" />
          ) : (
            <div className="viewport-empty">
              <div className="ve-inner">
                <RobynCharacter state={running ? "thinking" : "idle"} size={64} />
                <span>{running ? "opening the browser…" : "Robyn's browser appears here"}</span>
              </div>
            </div>
          )}

          {box ? (
            <div
              className="highlight show"
              style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
            />
          ) : null}

          <div
            className={"agent-cursor" + (box ? " show" : "") + (clicking ? " click" : "")}
            style={cursor}
          >
            <Icon name="cursor" size={22} />
            <span className="ring" />
          </div>

          {showResult && result ? (
            <ResultCard
              result={result}
              finalUrl={finalUrl}
              finalShot={frame?.screenshotUrl ?? undefined}
              onReplay={onReplay}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
