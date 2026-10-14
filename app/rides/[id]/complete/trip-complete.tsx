"use client";

/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import Link from "next/link";
import { methodLabels, tripSplit } from "@/lib/payment";
import { placeById } from "@/lib/places";
import { formatClock, rupees } from "@/lib/rides";
import { actions, bookingFor, findRide, useHydrated, useMe, useStore } from "@/lib/store";
import styles from "./complete.module.css";

const SWATCH = ["var(--unigo-dark-gray)", "var(--unigo-extra-light-gray)"];

export function TripComplete({ rideId }: { rideId: string }) {
  const s = useStore();
  const me = useMe();
  const hydrated = useHydrated();
  const ride = findRide(s, rideId);
  const booking = bookingFor(s, rideId);
  const payment = s.payments[rideId];

  if (!hydrated) return <div className={styles.screen} />;
  if (!ride || !booking) {
    return (
      <div className={styles.screen}>
        <div className={styles.missing}>
          <h1>No booking on this ride</h1>
          <p>Only riders with a seat can pay for a trip.</p>
          <Link href="/trips" className="btn btn-primary">
            My commutes
          </Link>
        </div>
      </div>
    );
  }

  const split = tripSplit(ride, booking.segment, booking.seats, booking.fare, me.name);
  const first = split.driver.name.split(" ")[0];

  return (
    <div className={styles.screen}>
      <div className={styles.top}>
        <Link href={`/rides/${ride.id}`} className={styles.close} aria-label="Close">
          <img src="/figma/icon-cross.svg" alt="" width={22} height={22} />
        </Link>
        <Link href={`/rides/${ride.id}/chat`} className={styles.help}>
          Need help?
        </Link>
      </div>

      <div className={styles.hero}>
        <span className={styles.badge}>
          <img src="/figma/icon-check-dark.svg" alt="" width={28} height={28} />
        </span>
        <div>
          <h1>Trip complete</h1>
          <p>
            Reached {placeById[booking.segment.to].name} at {formatClock(split.arrive)} · {split.km.toFixed(1)} km with {first}
          </p>
        </div>
      </div>

      <section className={styles.card}>
        <p className={styles.eyebrow}>YOUR FUEL CONTRIBUTION</p>
        <p className={`${styles.big} tnum`}>{rupees(split.youPay)}</p>
        <p className={styles.explain}>Fuel cost shared equally by the {split.people} people in the car</p>

        <div className={styles.bar} aria-hidden>
          {split.members.map((m, i) => (
            <span key={i} className={m.role === "you" ? styles.mine : undefined} style={{ flexGrow: m.role === "you" ? booking.seats : 1 }} />
          ))}
        </div>

        <ul className={styles.people}>
          {split.members.map((m, i) => (
            <li key={i}>
              <span
                className={styles.avatar}
                style={{
                  background:
                    m.role === "you" ? "var(--unigo-primary)" : m.role === "driver" ? "color-mix(in srgb, var(--unigo-primary) 52%, transparent)" : SWATCH[i % 2],
                }}
              >
                {m.initials}
              </span>
              <strong>{m.name}</strong>
              <span className="tnum">
                {m.role === "driver" ? "Driver · " : ""}
                {rupees(m.amount)}
              </span>
            </li>
          ))}
        </ul>

        <dl className={styles.facts}>
          <div>
            <dt>Distance travelled</dt>
            <dd className="tnum">{split.km.toFixed(1)} Km</dd>
          </div>
          <div>
            <dt>Fuel cost ({rupees(Number(split.perKm.toFixed(2)))} per km)</dt>
            <dd className="tnum">{rupees(split.fuelCost)}</dd>
          </div>
          <div>
            <dt>Split between</dt>
            <dd>{split.people} people</dd>
          </div>
        </dl>

        <div className={styles.total}>
          <span>You Pay</span>
          <span className="tnum">{rupees(split.youPay)}</span>
        </div>
      </section>

      <div className={styles.actions}>
        {payment ? (
          <div className={styles.status} role="status">
            <span className={styles.statusTick}>✓</span>
            <div>
              <strong>
                {payment.status === "settle-up"
                  ? `${rupees(payment.amount)} added to monthly settle-up`
                  : payment.status === "pending"
                    ? `Waiting for ${first} to confirm cash`
                    : `Paid ${rupees(payment.amount)} to ${first}`}
              </strong>
              <span>{methodLabels[payment.method]}</span>
            </div>
            <Link href="/trips" className="btn btn-dark">
              Done
            </Link>
          </div>
        ) : (
          <>
            <Link href={`/rides/${ride.id}/pay`} className={styles.pay}>
              <img src="/figma/icon-payments-white.svg" alt="" width={24} height={24} />
              PAY {rupees(split.youPay)}
            </Link>
            <button type="button" className={styles.settle} onClick={() => actions.pay(ride.id, "settle-up", split.youPay)}>
              <img src="/figma/icon-calendar.svg" alt="" width={20} height={20} />
              Add to monthly settle-up
            </button>
          </>
        )}
      </div>
    </div>
  );
}
