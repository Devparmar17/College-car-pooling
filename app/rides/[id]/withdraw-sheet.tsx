"use client";

import { useEffect, useRef, useState } from "react";
import type { Person } from "@/lib/data";
import { Avatar } from "../../ui/avatar";
import sheet from "./confirm-sheet.module.css";
import styles from "./withdraw-sheet.module.css";

export const CANCEL_REASONS = ["Plans changed", "Vehicle problem", "Not feeling well", "Running too late"] as const;

type Props = {
  route: string;
  when: string;
  /** Riders booked on the ride or waiting for your answer; they get the message. */
  riders: Person[];
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

/** Driver: "Cancel this ride?", with who will be told and why. */
export function WithdrawSheet({ route, when, riders, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);
  const keepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    keepRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const names = riders.map((p) => p.name.split(" ")[0]);

  return (
    <div className={sheet.backdrop} onClick={onClose}>
      <div className={sheet.sheet} role="alertdialog" aria-modal="true" aria-labelledby="withdraw-title" onClick={(e) => e.stopPropagation()}>
        <span className={sheet.grabber} aria-hidden />
        <h2 id="withdraw-title">Cancel this ride?</h2>
        <p className={styles.route}>
          {route}
          <span>{when}</span>
        </p>

        {riders.length > 0 ? (
          <div className={styles.told}>
            <span className={styles.faces} aria-hidden>
              {riders.slice(0, 3).map((p) => (
                <Avatar key={p.id} person={p} size={32} />
              ))}
            </span>
            <span>
              <strong>{names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0]}</strong> will get a
              message right away that the ride is cancelled.
            </span>
          </div>
        ) : (
          <p className={styles.none}>Nobody has booked yet, so no one needs to be told.</p>
        )}

        <fieldset className={styles.reasons}>
          <legend>Why are you cancelling?</legend>
          <div>
            {CANCEL_REASONS.map((r) => (
              <button key={r} type="button" className={styles.reason} aria-pressed={reason === r} onClick={() => setReason(r)}>
                {r}
              </button>
            ))}
          </div>
        </fieldset>

        <div className={sheet.actions}>
          <button type="button" className="btn btn-danger btn-block" onClick={() => onConfirm(reason)}>
            Cancel ride{riders.length ? ` and tell ${riders.length > 1 ? `${riders.length} riders` : names[0]}` : ""}
          </button>
          <button ref={keepRef} type="button" className="btn btn-block" onClick={onClose}>
            Keep ride
          </button>
        </div>
      </div>
    </div>
  );
}
