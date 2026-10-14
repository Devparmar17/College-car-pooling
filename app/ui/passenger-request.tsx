"use client";

import { useState } from "react";
import { personTitle } from "@/lib/data";
import { noteTime } from "@/lib/notifications";
import { placeById } from "@/lib/places";
import { dayLabels, formatClock, personById, rupees, segmentTimes } from "@/lib/rides";
import { actions, useStore, type RideRequest } from "@/lib/store";
import { Avatar } from "./avatar";
import { StarIcon } from "./icons";
import styles from "./passenger-request.module.css";

/** A passenger's seat or settle-up request, as the driver sees it: accept or decline. */
export function PassengerRequest({ request: req }: { request: RideRequest }) {
  const s = useStore();
  const [confirmDecline, setConfirmDecline] = useState(false);
  const rider = personById(req.riderId)!;
  const first = rider.name.split(" ")[0];
  const ride = s.offered.find((r) => r.id === req.rideId);
  const from = placeById[req.segment.from].name;
  const to = placeById[req.segment.to].name;
  const depart = ride ? segmentTimes(ride, req.segment).depart : 0;
  const free = ride ? ride.seatsTotal - ride.seatsTaken : 0;
  const seat = req.kind === "seat";
  const fits = !seat || free >= req.seats;
  const pending = req.status === "pending";

  function decline() {
    if (!confirmDecline) return setConfirmDecline(true);
    actions.declineRequest(req.id);
  }

  return (
    <article className={`card ${styles.card} ${pending ? styles.pending : styles.answered}`}>
      <header className={styles.head}>
        <Avatar person={rider} size={44} />
        <div className={styles.who}>
          <strong>{rider.name}</strong>
          <span>
            {personTitle(rider)} · <StarIcon size={12} /> {rider.rating.toFixed(1)}
          </span>
        </div>
        <span className={`chip ${seat ? "chip-brand" : ""}`}>{seat ? "Seat request" : "Settle-up"}</span>
      </header>

      <div className={styles.route}>
        <span className={styles.dots} aria-hidden>
          <i />
          <i />
        </span>
        <span className={styles.places}>
          <strong>{from}</strong>
          <strong>{to}</strong>
        </span>
        <span className={styles.amount}>
          <strong className="tnum">{rupees(req.amount)}</strong>
          <span>{seat ? `${req.seats} seat${req.seats > 1 ? "s" : ""}` : "monthly"}</span>
        </span>
      </div>

      <p className={styles.meta}>
        {seat && ride ? `${dayLabels[ride.day]}, pickup ${formatClock(depart)}` : (req.trip ?? "Earlier ride")}
        {" · "}
        {noteTime(req.answeredAt ?? req.at)}
      </p>

      {pending ? (
        <>
          {!fits && (
            <p className={styles.warn}>
              Only {free} seat{free === 1 ? "" : "s"} left on this ride. Decline, or ask {first} to book fewer.
            </p>
          )}
          {confirmDecline && <p className={styles.warn}>Decline {first}&apos;s request? They&apos;ll be told to find another ride.</p>}
          <div className={styles.actions}>
            <button type="button" className={`btn ${confirmDecline ? "btn-danger" : ""}`} onClick={decline}>
              {confirmDecline ? "Yes, decline" : "Decline"}
            </button>
            {confirmDecline ? (
              <button type="button" className="btn btn-dark" onClick={() => setConfirmDecline(false)}>
                Keep
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => actions.acceptRequest(req.id)} disabled={!fits}>
                Accept
              </button>
            )}
          </div>
        </>
      ) : (
        <p className={`${styles.result} ${req.status === "accepted" ? styles.ok : styles.no}`} role="status">
          <span aria-hidden>{req.status === "accepted" ? "✓" : "✕"}</span>
          {req.status === "accepted"
            ? seat
              ? `Accepted · ${first} will be at ${from} by ${formatClock(depart - 2)}`
              : `Accepted · ${rupees(req.amount)} on ${first}'s monthly settle-up`
            : `Declined · ${first} has been told`}
        </p>
      )}
    </article>
  );
}
