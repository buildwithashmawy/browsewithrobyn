"use client";

import { useEffect, useState } from "react";
import { RobynCharacter } from "./RobynCharacter";
import { Icon } from "./Icon";
import type { CharState } from "@/lib/types";

const LINES = [
  "Hey — I'm Robyn.",
  "Tell me what you need, in plain English.",
  "I'll drive a real browser and do it, step by step.",
];

// First-load welcome: Robyn wakes up, looks around, greets you, then invites you in.
export function RobynIntro({ onDone }: { onDone: () => void }) {
  const [charState, setCharState] = useState<CharState>("idle");
  const [step, setStep] = useState(0); // staggered reveal: 1..3 = lines, 4 = CTA
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, reduce ? ms * 0.2 : ms));

    // character greeting arc
    at(700, () => setCharState("thinking"));
    at(1700, () => setCharState("acting"));
    at(2700, () => setCharState("done"));
    at(4400, () => setCharState("idle"));
    // text + CTA reveal
    at(450, () => setStep(1));
    at(1250, () => setStep(2));
    at(2050, () => setStep(3));
    at(2900, () => setStep(4));

    return () => timers.forEach(clearTimeout);
  }, []);

  const dismiss = () => {
    setLeaving(true);
    setCharState("done");
    setTimeout(onDone, 520);
  };

  return (
    <div
      className={"intro" + (leaving ? " intro-leave" : "")}
      role="dialog"
      aria-label="Welcome to Robyn"
    >
      <div className="intro-glow" />
      <button className="intro-skip" onClick={dismiss}>
        Skip
      </button>
      <div className="intro-inner">
        <div className="intro-hero">
          <RobynCharacter state={charState} size={132} />
        </div>
        <div className="intro-lines">
          {LINES.map((line, i) =>
            i === 0 ? (
              <h1 key={i} className={"intro-line" + (step > i ? " in" : "")}>
                {line}
              </h1>
            ) : (
              <p
                key={i}
                className={"intro-line" + (step > i ? " in" : "")}
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                {line}
              </p>
            ),
          )}
        </div>
        <button
          className={"intro-cta" + (step >= 4 ? " in" : "")}
          onClick={dismiss}
        >
          Let&apos;s go
          <Icon name="arrow" size={16} />
        </button>
      </div>
    </div>
  );
}
