"use client";

import { useEffect, useState } from "react";

/** Epoch ms, ticking every second while `fast` (a trip is playing) and every 30 s otherwise; null until mounted. */
export function useNow(fast: boolean): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, fast ? 1000 : 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [fast]);
  return now;
}
