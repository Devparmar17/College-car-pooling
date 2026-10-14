"use client";

import { useEffect, useRef } from "react";
import type { Person } from "@/lib/data";
import { rupees } from "@/lib/rides";
import { Avatar } from "../../ui/avatar";
import styles from "./confirm-sheet.module.css";

type Props = {
  driver: Person;
  vehicle: string;
  day: string;
  pickup: { name: string; time: string };
  dropoff: { name: string; time: string };
  seats: number;
  fare: number;
  onConfirm: () => void;
  onClose: () => void;
};

/** "Confirm your booking": the last look before a seat is booked, since riders can't cancel. */
export function ConfirmSheet({ driver, vehicle, day, pickup, dropoff, seats, fare, onConfirm, onClose }: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const first = driver.name.split(" ")[0];

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.grabber} aria-hidden />
        <h2 id="confirm-title">Confirm your booking</h2>

        <div className={styles.driver}>
          <Avatar person={driver} size={44} />
          <div>
            <strong>{driver.name}</strong>
            <span>{vehicle}</span>
          </div>
        </div>

        <dl className={styles.rows}>
          <div>
            <dt>Pickup</dt>
            <dd>
              {pickup.name}
              <span>
                {day}, {pickup.time}
              </span>
            </dd>
          </div>
          <div>
            <dt>Drop-off</dt>
            <dd>
              {dropoff.name}
              <span>{dropoff.time}</span>
            </dd>
          </div>
          <div>
            <dt>Seats</dt>
            <dd>
              {seats} × {rupees(fare)}
              <span>Your share of the fuel</span>
            </dd>
          </div>
          <div className={styles.total}>
            <dt>Total</dt>
            <dd className="tnum">
              {rupees(fare * seats)}
              <span>Pay {first} after the ride</span>
            </dd>
          </div>
        </dl>

        <p className={styles.warning}>
          Once booked, {seats > 1 ? "these seats" : "this seat"} can’t be cancelled. If your plans change, chat with {first}.
        </p>

        <div className={styles.actions}>
          <button ref={confirmRef} type="button" className="btn btn-primary btn-block" onClick={onConfirm}>
            Confirm booking · {rupees(fare * seats)}
          </button>
          <button type="button" className="btn btn-block" onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
