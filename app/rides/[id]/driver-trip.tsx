"use client";

import type { Ride } from "@/lib/data";
import { placeById } from "@/lib/places";
import { formatClock, personById, rupees, segmentTimes } from "@/lib/rides";
import { useState } from "react";
import { actions, ridersOn, useStore, type Rating, type RideRequest, type RiderPayment } from "@/lib/store";
import { Avatar } from "../../ui/avatar";
import { StarIcon } from "../../ui/icons";
import { RatePerson } from "../../ui/rate-driver";
import styles from "./driver-trip.module.css";

const STEPS = ["Riders accepted", "Picking up", "Dropped off", "Paid"];

const payText: Record<RiderPayment["method"], string> = {
  upi: "Paying by UPI",
  cash: "Paying cash",
  "settle-up": "Wants monthly settle-up",
};

/**
 * Driver side of a ride once riders are accepted: start the trip, pick each rider up (or mark a
 * no-show), drop everyone off, then collect each fuel share and rate your riders.
 */
export function DriverTrip({ ride }: { ride: Ride }) {
  const s = useStore();
  const riders = ridersOn(s, ride);
  const drive = s.drives[ride.id];
  const to = placeById[ride.stops[ride.stops.length - 1]].name;

  const picked = riders.filter((q) => drive?.boarded[q.id] === "picked");
  const allBoarded = riders.length > 0 && riders.every((q) => drive?.boarded[q.id]);
  const allPaid = picked.every((q) => drive?.paid[q.id]?.status === "paid");
  // The step you're on; 4 once everyone has paid (every step ticked).
  const step = !drive?.startedAt ? 0 : !drive.completedAt ? 1 : !allPaid ? 2 : 4;
  const earned = picked.filter((q) => drive?.paid[q.id]?.status === "paid").reduce((sum, q) => sum + q.amount, 0);
  const due = picked.reduce((sum, q) => sum + q.amount, 0);
  const next = riders.find((q) => !drive?.boarded[q.id]);
  const noShows = riders.filter((q) => drive?.boarded[q.id] === "noshow").length;

  return (
    <section className={`card ${styles.trip}`} aria-live="polite">
      {step === 4 ? (
        // All done: one summary instead of the steps and a separate "everyone paid" note.
        <div className={styles.summary} role="status">
          <span className={styles.summaryIcon} aria-hidden>
            ✓
          </span>
          <span className={styles.summaryText}>
            <strong>Ride complete</strong>
            <span>
              {picked.length} rider{picked.length === 1 ? "" : "s"} · everyone paid
              {noShows ? ` · ${noShows} didn't show` : ""}
            </span>
          </span>
          <span className={styles.summaryAmount}>
            <span>You earned</span>
            <strong className="tnum">{rupees(earned)}</strong>
          </span>
        </div>
      ) : (
        <div className={styles.head}>
          <h2 className="section-title">Your trip</h2>
          <span className={styles.count}>
            {riders.length} rider{riders.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      {step < 4 && (
        <ol className={styles.steps} aria-label="Trip progress">
          {STEPS.map((label, i) => (
            <li key={label} className={i < step ? styles.done : i === step ? styles.now : ""}>
              <span aria-hidden>{i < step ? "✓" : i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      )}

      {riders.length === 0 ? (
        <p className={styles.empty}>No riders yet. Riders you accept on Ride requests show up here.</p>
      ) : (
        <>
          {step === 1 && next && (
            <p className={styles.next}>
              Next: pick up <strong>{personById(next.riderId)!.name.split(" ")[0]}</strong> at{" "}
              <strong>{placeById[next.segment.from].name}</strong>
            </p>
          )}

          <ul className={styles.riders}>
            {riders.map((q) => (
              <RiderRow key={q.id} ride={ride} req={q} />
            ))}
          </ul>

          {step === 0 && (
            <button type="button" className="btn btn-primary btn-block" onClick={() => actions.startDrive(ride.id)}>
              Start trip
            </button>
          )}
          {step === 1 && (
            <button type="button" className="btn btn-primary btn-block" disabled={!allBoarded} onClick={() => actions.finishDrive(ride.id)}>
              {allBoarded ? `Dropped everyone at ${to} · Complete ride` : "Mark every rider to finish"}
            </button>
          )}
          {step === 2 && (
            <p className={styles.collect}>
              Collected {rupees(earned)} of {rupees(due)}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function RiderRow({ ride, req }: { ride: Ride; req: RideRequest }) {
  const s = useStore();
  const drive = s.drives[ride.id];
  const rider = personById(req.riderId)!;
  const first = rider.name.split(" ")[0];
  const boarded = drive?.boarded[req.id];
  const pay = drive?.paid[req.id];
  const { depart } = segmentTimes(ride, req.segment);
  const [rating, setRating] = useState(false);
  // Older saves kept only a star count.
  const saved = drive?.rated[req.id] as Rating | number | undefined;
  const rated = typeof saved === "number" ? { stars: saved } : saved;

  return (
    <li className={`${styles.rider} ${boarded === "noshow" ? styles.noshow : ""}`}>
      <div className={styles.who}>
        <Avatar person={rider} size={40} />
        <span className={styles.whoText}>
          <strong>{rider.name}</strong>
          <span>
            {placeById[req.segment.from].name} · {formatClock(depart)} · {req.seats} seat{req.seats > 1 ? "s" : ""}
          </span>
        </span>
        <span className={`${styles.amount} tnum`}>{boarded === "noshow" ? "—" : rupees(req.amount)}</span>
      </div>

      {/* On the way: did they get in? */}
      {drive?.startedAt && !drive.completedAt && !boarded && (
        <div className={styles.actions}>
          <button type="button" className="btn" onClick={() => actions.board(ride.id, req.id, "noshow")}>
            Didn&apos;t show
          </button>
          <button type="button" className="btn btn-dark" onClick={() => actions.board(ride.id, req.id, "picked")}>
            Picked up
          </button>
        </div>
      )}
      {boarded && !drive?.completedAt && (
        <p className={boarded === "picked" ? styles.ok : styles.muted}>
          {boarded === "picked" ? `✓ ${first} is in the car` : `${first} didn't show · no charge`}
        </p>
      )}

      {/* After drop-off: their fuel share. */}
      {drive?.completedAt && boarded === "noshow" && <p className={styles.muted}>Didn&apos;t show · no charge</p>}
      {/* After drop-off, one line: their payment, then your rating of them. */}
      {drive?.completedAt && pay && (
        <div className={styles.payRow}>
          {pay.status === "paid" ? (
            <p className={styles.ok}>
              ✓ Paid · {pay.method === "upi" ? "UPI" : pay.method === "cash" ? "Cash" : "Settle-up"}
            </p>
          ) : (
            <p className={styles.waiting}>{payText[pay.method]}…</p>
          )}
          {pay.status !== "paid" && pay.method !== "upi" ? (
            <button type="button" className="btn btn-primary" onClick={() => actions.settleRider(ride.id, req.id)}>
              {pay.method === "cash" ? `Got ${rupees(req.amount)} cash` : "Accept"}
            </button>
          ) : rated ? (
            <span className={styles.rated} aria-label={`You rated ${first} ${rated.stars} out of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <StarIcon key={n} size={14} className={n <= rated.stars ? styles.starOn : styles.star} />
              ))}
            </span>
          ) : (
            <button type="button" className={styles.rateBtn} aria-expanded={rating} onClick={() => setRating(!rating)}>
              <StarIcon size={14} /> Rate {first}
            </button>
          )}
        </div>
      )}
      {/* The full rating card opens only when asked for, and closes once it's sent. */}
      {drive?.completedAt && boarded === "picked" && rating && !rated && (
        <RatePerson
          id={req.id}
          person={rider}
          about="rider"
          onSubmit={(r) => {
            actions.rateRider(ride.id, req.id, r);
            setRating(false);
          }}
          compact
        />
      )}
    </li>
  );
}
