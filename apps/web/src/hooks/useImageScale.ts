import { useEffect, useRef, useState } from "react";
import type { HighlightRect } from "@/lib/types";

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Project an agent-space rect (CSS px within the agent's viewport) onto the
// rendered <img> box. The screenshot fills the viewport with object-fit: cover
// + object-position: top center, so it's scaled up and the overflow is cropped;
// we mirror that math and hide the overlay if the target is cropped out of view.
export function projectRect(
  rect: HighlightRect,
  natW: number,
  natH: number,
  cw: number,
  ch: number,
  pad = 6,
): Box | null {
  if (!natW || !natH || !cw || !ch) return null;
  const scale = Math.max(cw / natW, ch / natH); // cover
  // object-position: top left → no offset; overflow is cropped on the right/bottom
  const left = rect.x * scale - pad;
  const top = rect.y * scale - pad;
  const width = rect.w * scale + pad * 2;
  const height = rect.h * scale + pad * 2;
  // cropped entirely out of the visible viewport → don't draw
  if (left + width < 0 || left > cw || top + height < 0 || top > ch) return null;
  return { left, top, width, height };
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
