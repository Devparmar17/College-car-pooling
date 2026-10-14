"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { placeById } from "@/lib/places";
import { formatClock, personById, rupees, segmentKm } from "@/lib/rides";
import { actions, findRide, useHydrated, useStore } from "@/lib/store";
import { isPlaying, tripStage } from "@/lib/trip";
import { useNow } from "@/lib/use-now";
import { Avatar } from "./avatar";
import styles from "./trip-watcher.module.css";

// No pop-up while signing in, or on the screens the pop-up itself leads to.
const QUIET = /^\/(login|signup)|^\/rides\/[^/]+\/(complete|pay)/;

/**
 * Watches every booked ride. When one reaches its drop-off it's marked complete (with an
 * alert), and the rider gets a "Ride complete" screen that leads to paying and rating.
 */
export function TripWatcher() {
  const s = useStore();
  const hydrated = useHydrated();
  const pathname = usePathname();
  const now = useNow(s.bookings.some((b) => isPlaying(s.trips[b.rideId])));

  useEffect(() => {
    if (now === null) return;
    for (const b of s.bookings) {
      const ride = findRide(s, b.rideId);
      const trip = s.trips[b.rideId];
      // Already paid from the ride page: nothing left to tell the rider.
      if (!ride || trip?.completedAt || s.payments[b.rideId]) continue;
      if (tripStage(ride, b.segment, trip, now).stage === "completed") actions.completeTrip(b.rideId);
    }
  }, [now, s]);

  if (!hydrated || QUIET.test(pathname)) return null;
  const booking = s.bookings.find((b) => s.trips[b.rideId]?.completedAt && !s.trips[b.rideId]?.seen && !s.payments[b.rideId]);
  const ride = booking && findRide(s, booking.rideId);
  if (!booking || !ride) return null;

  const driver = personById(ride.driverId)!;
  const first = driver.name.split(" ")[0];
  const to = placeById[booking.segment.to];
  const done = new Date(s.trips[ride.id].completedAt!);
  const amount = booking.fare * booking.seats;
  const dismiss = () => actions.dismissComplete(ride.id);

  return (
    <div className={styles.backdrop}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-labelledby="ride-complete-title">
        <span className={styles.badge} aria-hidden>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path className={styles.tick} d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className={styles.eyebrow}>Ride complete</p>
        <h2 id="ride-complete-title">You&apos;ve arrived!</h2>
        <p className={styles.where}>
          Reached <strong>{to.name}</strong> at {formatClock(done.getHours() * 60 + done.getMinutes())}
        </p>

        <div className={styles.facts}>
          <div className={styles.driver}>
            <Avatar person={driver} size={40} />
            <span>
              <strong>{driver.name}</strong>
              <span>Your driver</span>
            </span>
          </div>
          <dl>
            <div>
              <dt>Distance</dt>
              <dd className="tnum">{segmentKm(ride, booking.segment).toFixed(1)} km</dd>
            </div>
            <div>
              <dt>Your share</dt>
              <dd className="tnum">{rupees(amount)}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.actions}>
          <Link href={`/rides/${ride.id}/complete`} className="btn btn-primary btn-block" onClick={dismiss}>
            Pay {rupees(amount)} to {first}
          </Link>
          <button type="button" className="btn btn-block" onClick={dismiss}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
