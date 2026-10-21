"use client";

import Link from "next/link";
import { placeById } from "@/lib/places";
import { compareRides, dayLabels, formatClock, hasLeft, leavesIn, personById, rupees, segmentTimes } from "@/lib/rides";
import { findRide, useHydrated, useNowMinutes, useStore } from "@/lib/store";
import { Avatar } from "./ui/avatar";
import { ContactButtons } from "./ui/contact-buttons";
import styles from "./next-ride.module.css";

/**
 * Home's first card: what you have going on. A finished ride still to pay for comes first
 * (finish what you started), then your next booked ride. Nothing booked: no card.
 */
export function NextRide() {
  const s = useStore();
  const hydrated = useHydrated();
  const now = useNowMinutes();
  if (!hydrated) return null;

  const booked = s.bookings
    .map((b) => ({ b, ride: findRide(s, b.rideId)! }))
    .filter(({ ride }) => ride)
    .sort((x, y) => compareRides(x.ride, y.ride));

  const unpaid = booked.find(({ b }) => s.trips[b.rideId]?.completedAt && !s.payments[b.rideId]);
  if (unpaid) {
    const driver = personById(unpaid.ride.driverId)!;
    const amount = unpaid.b.fare * unpaid.b.seats;
    return (
      <Link href={`/rides/${unpaid.ride.id}/complete`} className={`${styles.card} ${styles.pay}`}>
        <span className={styles.badge} aria-hidden>
          ✓
        </span>
        <span className={styles.payText}>
          <strong>Ride with {driver.name.split(" ")[0]} complete</strong>
          <span>Pay your {rupees(amount)} fuel share and rate the ride</span>
        </span>
        <span className={styles.payCta}>Pay {rupees(amount)}</span>
      </Link>
    );
  }

  const next = booked.find(({ b, ride }) => !s.trips[b.rideId]?.completedAt && !s.payments[b.rideId] && !hasLeft(ride, b.segment, now));
  if (!next) return null;

  const { b, ride } = next;
  const driver = personById(ride.driverId)!;
  const { depart, arrive } = segmentTimes(ride, b.segment);
  const soon = leavesIn(ride, depart, now);

  return (
    <section className={styles.card} aria-label="Your next ride">
      <div className={styles.top}>
        <span className={styles.label}>Your next ride</span>
        <span className={styles.when}>
          {dayLabels[ride.day]} · {formatClock(depart)}
          {ride.day === 0 && soon !== formatClock(depart) ? ` · ${soon}` : ""}
        </span>
      </div>

      <div className={styles.route}>
        <span className={styles.dots} aria-hidden>
          <i />
          <i />
        </span>
        <span className={styles.stops}>
          <span>
            <strong>{placeById[b.segment.from].name}</strong>
            <span className="tnum">{formatClock(depart)}</span>
          </span>
          <span>
            <strong>{placeById[b.segment.to].name}</strong>
            <span className="tnum">{formatClock(arrive)}</span>
          </span>
        </span>
      </div>

      <div className={styles.foot}>
        <Link href={`/rides/${ride.id}`} className={styles.driver}>
          <Avatar person={driver} size={36} />
          <span>
            <strong>{driver.name}</strong>
            <span>
              {ride.vehicle.model} · {ride.vehicle.plate}
            </span>
          </span>
        </Link>
        <ContactButtons driver={driver} rideId={ride.id} />
      </div>
    </section>
  );
}
