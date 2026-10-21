"use client";

import type { Ride } from "@/lib/data";
import { personById } from "@/lib/rides";
import { actions, useStore } from "@/lib/store";
import styles from "./demo-panel.module.css";

/**
 * Rider demo controls in one place, clearly labelled: watch your booked trip play out in a few
 * seconds, or see what happens when the driver cancels. Nothing real is sent.
 */
export function DemoPanel({ ride }: { ride: Ride }) {
  const s = useStore();
  const trip = s.trips[ride.id];
  if (s.payments[ride.id] || trip?.simStart || trip?.completedAt) return null;
  const first = personById(ride.driverId)?.name.split(" ")[0] ?? "the driver";

  return (
    <section className={`card ${styles.demo}`} aria-labelledby="demo-title">
      <h2 id="demo-title" className={styles.title}>
        <span className={styles.tag}>Demo</span>
        Try what happens next
      </h2>
      <p className={styles.sub}>Nothing real is sent. Watch this trip play out in a few seconds, or see how a cancellation looks.</p>
      <div className={styles.actions}>
        <button type="button" className="btn btn-dark" onClick={() => actions.playTrip(ride.id)}>
          ▶ Play this trip
        </button>
        <button type="button" className="btn" onClick={() => actions.driverCancels(ride.id, "Vehicle problem")}>
          {first} cancels
        </button>
      </div>
    </section>
  );
}
