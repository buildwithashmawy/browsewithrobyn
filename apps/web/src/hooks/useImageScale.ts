import { useEffect, useRef, useState } from "react";
import type { HighlightRect } from "@/lib/types";

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Project an agent-space rect (CSS px within the agent's viewport) onto the
// rendered <img> box. The screenshot is shown with object-fit: contain, so the
// whole feed is always visible (never cropped); the agent captures at the panel's
// aspect ratio so there's effectively no letterbox. We mirror the contain math.
export function projectRect(
  rect: HighlightRect,
  natW: number,
  natH: number,
  cw: number,
  ch: number,
  pad = 6,
): Box | null {
  if (!natW || !natH || !cw || !ch) return null;
  const scale = Math.min(cw / natW, ch / natH); // contain
  const offX = (cw - natW * scale) / 2;
  const offY = (ch - natH * scale) / 2;
  return {
    left: offX + rect.x * scale - pad,
    top: offY + rect.y * scale - pad,
    width: rect.w * scale + pad * 2,
    height: rect.h * scale + pad * 2,
  };
}

// Track an element's content-box size, recomputing on resize.
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}
