import type { CSSProperties, ReactNode } from "react";

// Ported from the design's icons.jsx — clean 1.6px stroke line icons.
// Rendered via <Icon name="..." size={n} />.

export type IconName =
  | "navigate"
  | "click"
  | "type"
  | "wait"
  | "extract"
  | "scroll"
  | "verify"
  | "check"
  | "warn"
  | "send"
  | "arrow"
  | "spark"
  | "sun"
  | "moon"
  | "replay"
  | "lock"
  | "back"
  | "fwd"
  | "refresh"
  | "cursor"
  | "cal"
  | "users"
  | "clock"
  | "pin"
  | "star"
  | "cal2"
  | "share"
  | "search"
  | "sliders"
  | "plus"
  | "phone"
  | "mail"
  | "flame"
  | "eye"
  | "stop"
  | "chevron"
  | "external"
  | "x"
  | "layers"
  | "chat"
  | "window";

interface Spec {
  c: ReactNode;
  fill?: boolean; // fill with currentColor (and no stroke)
  fillColor?: string; // explicit fill (e.g. cursor)
  svgStroke?: string; // explicit stroke color override
  stroke?: number; // stroke width (default 1.6)
  vb?: number; // viewBox size (default 24)
  defaultSize?: number;
}

const SPECS: Record<IconName, Spec> = {
  navigate: {
    c: (
      <>
        <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
        <path d="M14.5 9.5l-2 5-5 2 2-5 5-2z" />
      </>
    ),
  },
  click: {
    c: (
      <>
        <path d="M9 4.5v6" />
        <path d="M9 7.5l9 4-4 1.5-1.5 4-3.5-9.5z" />
      </>
    ),
  },
  type: {
    c: (
      <>
        <path d="M4 6h16v12H4z" opacity={0.45} />
        <path d="M7 10h2M11 10h2M15 10h2M7 14h10" />
      </>
    ),
  },
  wait: {
    c: (
      <>
        <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
        <path d="M12 8v4l3 2" />
      </>
    ),
  },
  extract: {
    c: (
      <>
        <path d="M6 3h8l4 4v14H6z" opacity={0.45} />
        <path d="M14 3v4h4" opacity={0.45} />
        <path d="M9 13h6M9 16.5h4" />
      </>
    ),
  },
  scroll: {
    c: (
      <>
        <path d="M12 4v16" />
        <path d="M8 8l4-4 4 4" />
        <path d="M8 16l4 4 4-4" />
      </>
    ),
  },
  verify: {
    c: (
      <>
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 11.5l2 2 4-4" />
      </>
    ),
  },
  check: { c: <path d="M5 12.5l4.5 4.5L19 7" />, stroke: 2 },
  warn: {
    c: (
      <>
        <path d="M12 8v5" />
        <path d="M12 16.5v.01" />
      </>
    ),
    stroke: 2,
  },
  send: { c: <path d="M5 12h13M12 5l7 7-7 7" strokeWidth={2} /> },
  arrow: { c: <path d="M5 12h13M13 6l6 6-6 6" /> },
  spark: { c: <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />, fill: true },
  sun: {
    c: (
      <>
        <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
      </>
    ),
  },
  moon: { c: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /> },
  replay: {
    c: (
      <>
        <path d="M4 12a8 8 0 1 0 2.3-5.6" />
        <path d="M4 4v4h4" />
      </>
    ),
  },
  lock: {
    defaultSize: 13,
    c: (
      <>
        <path d="M6 10V7a4 4 0 1 1 8 0v3" transform="translate(2 1)" />
        <path d="M5 10h14v9H5z" />
      </>
    ),
  },
  back: { c: <path d="M15 6l-6 6 6 6" /> },
  fwd: { c: <path d="M9 6l6 6-6 6" /> },
  refresh: {
    c: (
      <>
        <path d="M4 12a8 8 0 1 1 2.3 5.6" />
        <path d="M4 20v-4h4" transform="translate(0 -0.4)" />
      </>
    ),
  },
  cursor: {
    fillColor: "var(--accent)",
    svgStroke: "#fff",
    c: <path d="M5 3l13 7-5.5 1.8L9.5 18 5 3z" strokeWidth={1.2} />,
  },
  cal: {
    c: (
      <>
        <path d="M4 6h16v15H4z" />
        <path d="M4 10h16M8 3v4M16 3v4" />
      </>
    ),
  },
  users: {
    c: (
      <>
        <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M16 4.5a3.5 3.5 0 0 1 0 6.8" />
        <path d="M17 14.2A6.5 6.5 0 0 1 21.5 20" />
      </>
    ),
  },
  clock: {
    c: (
      <>
        <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
        <path d="M12 8v4l3 2" />
      </>
    ),
  },
  pin: {
    c: (
      <>
        <path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z" />
        <path d="M12 12a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8z" />
      </>
    ),
  },
  star: { c: <path d="M12 3.5l2.4 5 5.4.7-4 3.7 1 5.4L12 16.6 7.2 18.3l1-5.4-4-3.7 5.4-.7L12 3.5z" />, fill: true },
  cal2: {
    c: (
      <>
        <path d="M4 6h16v15H4z" />
        <path d="M4 10h16M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01" />
      </>
    ),
  },
  share: {
    c: (
      <>
        <path d="M16 6l-4-3-4 3" />
        <path d="M12 3v12" />
        <path d="M5 11v9h14v-9" />
      </>
    ),
  },
  search: {
    c: (
      <>
        <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
        <path d="M20 20l-4-4" />
      </>
    ),
  },
  sliders: {
    c: (
      <>
        <path d="M4 8h10M18 8h2" />
        <path d="M4 16h2M10 16h10" />
        <path d="M14 5v6M6 13v6" />
      </>
    ),
  },
  plus: { c: <path d="M12 5v14M5 12h14" /> },
  phone: { c: <path d="M6 3h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 7a2 2 0 0 1 2-4z" /> },
  mail: {
    c: (
      <>
        <path d="M3 6h18v12H3z" />
        <path d="M3 7l9 6 9-6" />
      </>
    ),
  },
  flame: { c: <path d="M12 2c1 3-2 4-2 7a2 2 0 0 0 4 0c2 1.5 3 3.5 3 6a5 5 0 0 1-10 0c0-3 2-4 2-7 0-2 2-2 3-6z" />, fill: true },

  // ── added for the real build ──
  eye: {
    c: (
      <>
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
        <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      </>
    ),
  },
  stop: { c: <rect x={6} y={6} width={12} height={12} rx={2.5} />, fill: true },
  chevron: { c: <path d="M6 9l6 6 6-6" /> },
  external: {
    c: (
      <>
        <path d="M14 4h6v6" />
        <path d="M20 4l-9 9" />
        <path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" />
      </>
    ),
  },
  x: { c: <path d="M6 6l12 12M18 6L6 18" strokeWidth={2} /> },
  layers: {
    c: (
      <>
        <path d="M12 3l9 5-9 5-9-5 9-5z" />
        <path d="M3 13l9 5 9-5" />
      </>
    ),
  },
  chat: { c: <path d="M4 5h16v11H9l-3.5 3.5V16H4z" /> },
  window: {
    c: (
      <>
        <path d="M3 5h18v14H3z" />
        <path d="M3 9h18" />
      </>
    ),
  },
};

export function Icon({
  name,
  size,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const s = SPECS[name] ?? SPECS.navigate;
  const vb = s.vb ?? 24;
  const px = size ?? s.defaultSize ?? 16;
  const fill = s.fillColor ?? (s.fill ? "currentColor" : "none");
  const strokeColor = s.svgStroke ?? (s.fill && !s.fillColor ? "none" : "currentColor");
  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${vb} ${vb}`}
      fill={fill}
      stroke={strokeColor}
      strokeWidth={s.stroke ?? 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {s.c}
    </svg>
  );
}

export function hasIcon(name: string): name is IconName {
  return Object.prototype.hasOwnProperty.call(SPECS, name);
}
