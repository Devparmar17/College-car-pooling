"use client";

import { useEffect, useState } from "react";
import styles from "./auth.module.css";

const WAIT = 24;

/** "Didn't get it? Resend in 0:24", which becomes a Resend button when the wait is over. */
export function Resend({ onResend }: { onResend?: () => void }) {
  const [left, setLeft] = useState(WAIT);

  useEffect(() => {
    if (left <= 0) return;
    const t = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);

  return (
    <button
      type="button"
      className={styles.resend}
      disabled={left > 0}
      onClick={() => {
        setLeft(WAIT);
        onResend?.();
      }}
    >
      Didn’t get it?{" "}
      <strong className="tnum">{left > 0 ? `Resend in 0:${String(left).padStart(2, "0")}` : "Resend code"}</strong>
    </button>
  );
}
