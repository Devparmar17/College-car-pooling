"use client";

import Link from "next/link";
import type { Ride } from "@/lib/data";
import { placeById } from "@/lib/places";
import { dayLabels, formatClock, personById, rupees, segmentTimes } from "@/lib/rides";
import { actions, useStore, type Booking } from "@/lib/store";
import { isPlaying, tripStage, type Stage } from "@/lib/trip";
import { useNow } from "@/lib/use-now";
import styles from "./trip-tracker.module.css";

const order: Stage[] = ["booked", "arriving", "onboard", "completed"];

/** Where your booked ride is: booked → driver on the way → on the ride → reached. */
export function TripTracker({ ride, booking }: { ride: Ride; booking: Booking }) {
  const s = useStore();
  const trip = s.trips[ride.id];
  const payment = s.payments[ride.id];
  const now = useNow(isPlaying(trip));
  if (now === null) return null;

  const { stage, progress } = tripStage(ride, booking.segment, trip, now);
  const at = order.indexOf(stage);
  const first = personById(ride.driverId)?.name.split(" ")[0] ?? "Your driver";
  const from = placeById[booking.segment.from].name;
  const to = placeById[booking.segment.to].name;
  const { depart, arrive } = segmentTimes(ride, booking.segment);
  const minsLeft = Math.max(1, Math.ceil((1 - progress) * (arrive - depart)));

  const steps = [
    { title: "Seat booked", sub: `${dayLabels[ride.day]}, ${formatClock(depart)}` },
    { title: `${first} is on the way`, sub: `Pickup at ${from}` },
    { title: "On the ride", sub: stage === "onboard" ? `About ${minsLeft} min to ${to}` : `To ${to}` },
    { title: `Reached ${to}`, sub: stage === "completed" ? "Ride complete" : `Around ${formatClock(arrive)}` },
  ];

  return (
    <section className={`card ${styles.tracker}`} aria-live="polite">
      <h2 className="section-title">Trip status</h2>
      <ol className={styles.steps}>
        {steps.map((step, i) => (
          <li key={i} className={i < at ? styles.done : i === at ? styles.now : styles.next}>
            <span className={styles.dot} aria-hidden>
              {i < at || stage === "completed" ? "✓" : ""}
            </span>
            <span className={styles.text}>
              <strong>{step.title}</strong>
              <span>{step.sub}</span>
              {i === 2 && stage === "onboard" && (
                <span className={styles.bar} role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${progress * 100}%` }} />
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>

      {stage === "completed" ? (
        payment ? null : (
          <Link href={`/rides/${ride.id}/complete`} className="btn btn-primary btn-block">
            Pay {rupees(booking.fare * booking.seats)} and rate the ride
          </Link>
        )
      ) : (
        stage === "booked" &&
        !payment && (
          <button type="button" className={`btn btn-block ${styles.play}`} onClick={() => actions.playTrip(ride.id)}>
            ▶ Play this trip (demo)
          </button>
        )
      )}
    </section>
  );
}
