"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import styles from "./otp-input.module.css";

const LENGTH = 6;

/** Six digit boxes (Figma "Digit"). Typing moves forward, backspace moves back, pasting fills them all. */
export function OtpInput({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(LENGTH, " ").slice(0, LENGTH).split("");

  function setAt(i: number, d: string) {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join("").replace(/\s+$/, ""));
  }

  function onInput(i: number, raw: string) {
    const d = raw.replace(/\D/g, "").slice(-1);
    if (!d) return;
    setAt(i, d);
    refs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i].trim()) setAt(i, " ");
      else if (i > 0) {
        setAt(i - 1, " ");
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft") refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight") refs.current[i + 1]?.focus();
  }

  function onPaste(e: ClipboardEvent) {
    const code = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!code) return;
    e.preventDefault();
    onChange(code);
    refs.current[Math.min(code.length, LENGTH - 1)]?.focus();
  }

  return (
    <div className={styles.row} role="group" aria-label="6-digit code" onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`${styles.digit} ${d.trim() ? styles.filled : ""}`}
          value={d.trim()}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={2}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
