"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";
import { Footer } from "./Footer";
import { ROTATE } from "@/lib/examples";
import type { PillStyle } from "@/lib/types";

export function Composer({
  onSend,
  onStop,
  running,
  status,
  pillStyle,
}: {
  onSend: (text: string) => void;
  onStop: () => void;
  running: boolean;
  status: string;
  pillStyle: PillStyle;
}) {
  const [val, setVal] = useState("");
  const [ph, setPh] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (val) return; // pause rotation while typing
    const id = setInterval(() => setPh((p) => (p + 1) % ROTATE.length), 3200);
    return () => clearInterval(id);
  }, [val]);

  const submit = () => {
    if (running) return;
    const text = val.trim() || ROTATE[ph];
    onSend(text);
    setVal("");
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="composer-wrap">
      <div className="status-pill-row">
        <StatusPill state={status} styleName={pillStyle} />
      </div>
      <div className="composer">
        <textarea
          ref={taRef}
          rows={1}
          value={val}
          placeholder={ROTATE[ph]}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={onKey}
          disabled={running}
        />
        {running ? (
          <button
            className="send-btn is-stop"
            onClick={onStop}
            aria-label="Stop run"
            title="Stop"
          >
            <Icon name="stop" size={15} />
          </button>
        ) : (
          <button
            className="send-btn"
            onClick={submit}
            aria-label="Send command"
          >
            <Icon name="send" size={18} />
          </button>
        )}
      </div>
      <div className="composer-hint">
        {running ? (
          "Robyn is working…"
        ) : (
          <>
            Press <kbd>Enter</kbd> to run · <kbd>Shift+Enter</kbd> for newline
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
