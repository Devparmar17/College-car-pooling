"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { placeById } from "@/lib/places";
import { personById, rupees } from "@/lib/rides";
import { actions, useHydrated, useStore } from "@/lib/store";
import { Avatar } from "./avatar";
import styles from "./cancel-notice.module.css";

const QUIET = /^\/(login|signup)/;
const TOAST_MS = 6000;

/**
 * Rider: a pop-up the moment a driver cancels your booked ride, with a way to find another.
 * Driver: a short toast confirming your riders were told.
 */
export function CancelNotice() {
  const s = useStore();
  const hydrated = useHydrated();
  const pathname = usePathname();
  const note = hydrated && !QUIET.test(pathname) ? s.cancellations.find((c) => !c.seen) : undefined;

  // The driver's toast goes away on its own.
  useEffect(() => {
    if (note?.side !== "driver") return;
    const timer = window.setTimeout(() => actions.dismissCancellation(note.id), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [note]);

  if (!note) return null;
  const dismiss = () => actions.dismissCancellation(note.id);
  const from = placeById[note.segment.from].name;
  const to = placeById[note.segment.to].name;

  if (note.side === "driver") {
    return (
      <div className={styles.toast} role="status">
        <span className={styles.toastIcon} aria-hidden>
          ✓
        </span>
        <span>
          <strong>Ride cancelled</strong>
          {note.told.length
            ? `${note.told.map((n) => n.split(" ")[0]).join(", ")} ${note.told.length > 1 ? "were" : "was"} told right away.`
            : "No riders had booked, so no one was affected."}
        </span>
        <button type="button" onClick={dismiss} aria-label="Close">
          ✕
        </button>
      </div>
    );
  }

  const driver = personById(note.driverId)!;
  const first = driver.name.split(" ")[0];
  const findHref = `/find?from=${note.segment.from}&to=${note.segment.to}`;

  return (
    <div className={styles.backdrop}>
      <div className={styles.card} role="alertdialog" aria-modal="true" aria-labelledby="cancel-title">
        <span className={styles.badge} aria-hidden>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </span>
        <p className={styles.eyebrow}>Ride cancelled</p>
        <h2 id="cancel-title">{first} cancelled your ride</h2>
        <p className={styles.sub}>
          {note.refund ? "Sorry about that. Your money is back in your Campus Wallet." : "Sorry about that. You haven't been charged."}
        </p>

        <div className={styles.details}>
          <div className={styles.driver}>
            <Avatar person={driver} size={40} />
            <span>
              <strong>{driver.name}</strong>
              <span>Reason: {note.reason}</span>
            </span>
          </div>
          <dl>
            <div>
              <dt>Route</dt>
              <dd>
                {from} → {to}
              </dd>
            </div>
            <div>
              <dt>Was leaving</dt>
              <dd>{note.when}</dd>
            </div>
            {note.refund ? (
              <div>
                <dt>Refunded</dt>
                <dd>{rupees(note.refund)} to Campus Wallet</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className={styles.actions}>
          <Link href={findHref} className="btn btn-primary btn-block" onClick={dismiss}>
            Find another ride
          </Link>
          <button type="button" className="btn btn-block" onClick={dismiss}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
