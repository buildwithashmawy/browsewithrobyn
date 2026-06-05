"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";
import type { ModelInfo } from "@/lib/types";

export function ModelPicker({
  models,
  value,
  onChange,
  loading,
  disabled,
}: {
  models: ModelInfo[];
  value: string;
  onChange: (id: string) => void;
  loading: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = models.find((m) => m.id === value);

  const { vision, textOnly, showSelected } = useMemo(() => {
    const s = q.trim().toLowerCase();
    const match = (m: ModelInfo) =>
      !s || m.name.toLowerCase().includes(s) || m.id.toLowerCase().includes(s);
    // pin the selected model to the top; drop it from the groups so it isn't repeated
    const rest = models.filter((m) => m.id !== value);
    const filtered = rest.filter(match);
    return {
      vision: filtered.filter((m) => m.vision),
      textOnly: filtered.filter((m) => !m.vision),
      showSelected: !!current && match(current),
    };
  }, [models, q, value, current]);

  const label =
    loading && !models.length
      ? "Loading models…"
      : current?.name ?? value ?? "Select model";

  return (
    <div className="model-picker" ref={ref}>
      <button
        className="model-btn"
        onClick={() => setOpen((o) => !o)}
        title={current ? `${current.name} — ${current.id}` : "Select model"}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current?.vision ? (
          <span className="mp-eye">
            <Icon name="eye" size={13} />
          </span>
        ) : null}
        <span className="mp-name">{label}</span>
        <span className="mp-caret">
          <Icon name="chevron" size={13} />
        </span>
      </button>

      {open ? (
        <div className="model-menu scroll" role="listbox">
          <input
            className="model-search"
            placeholder="Search models…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />

          {showSelected && current ? (
            <>
              <div className="mp-group-label">Selected</div>
              <button
                className="mp-item"
                role="option"
                aria-selected
                onClick={() => setOpen(false)}
              >
                {current.vision ? (
                  <span className="mp-i-eye">
                    <Icon name="eye" size={13} />
                  </span>
                ) : null}
                <span className="mp-i-name">{current.name}</span>
                <span className="mp-i-check">
                  <Icon name="check" size={13} />
                </span>
              </button>
            </>
          ) : null}

          {vision.length > 0 ? (
            <div className="mp-group-label">Vision · recommended</div>
          ) : null}
          {vision.map((m) => (
            <button
              key={m.id}
              className="mp-item"
              role="option"
              aria-selected={m.id === value}
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
            >
              <span className="mp-i-eye">
                <Icon name="eye" size={13} />
              </span>
              <span className="mp-i-name">{m.name}</span>
            </button>
          ))}

          {textOnly.length > 0 ? (
            <>
              <div className="mp-group-label">Text-only</div>
              <div className="mp-note warn">
                Robyn sends screenshots — text-only models can&apos;t see the page.
              </div>
              {textOnly.map((m) => (
                <button
                  key={m.id}
                  className="mp-item"
                  role="option"
                  aria-selected={false}
                  disabled
                  title="No vision — Robyn needs to see screenshots"
                >
                  <span className="mp-i-name">{m.name}</span>
                  <span className="mp-i-tag">text</span>
                </button>
              ))}
            </>
          ) : null}

          {!vision.length && !textOnly.length ? (
            <div className="mp-note">No models match “{q}”.</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
