"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./carousel.module.css";

/**
 * Horizontal snap carousel. The card at the front is full size; the rest shrink,
 * following the finger as you swipe. Each card gets `--focus`: 1 in front, 0 one card away.
 */
export function Carousel({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const start = row.scrollLeft + parseFloat(getComputedStyle(row).paddingLeft);
      for (const card of Array.from(row.children) as HTMLElement[]) {
        // Layout offsets ignore the scale transform, so positions stay stable while cards animate.
        const step = card.offsetWidth + parseFloat(getComputedStyle(row).columnGap || "0");
        const t = Math.min(Math.abs(card.offsetLeft - start) / step, 1);
        card.style.setProperty("--focus", (1 - t).toFixed(3));
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    row.addEventListener("scroll", schedule, { passive: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(row);
    return () => {
      row.removeEventListener("scroll", schedule);
      resize.disconnect();
      cancelAnimationFrame(frame);
    };
  });

  return (
    <div ref={ref} className={styles.row} role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}
