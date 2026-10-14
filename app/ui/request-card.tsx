"use client";

/* eslint-disable @next/next/no-img-element -- Figma icon assets are tiny SVGs rendered at their native size. */
import Link from "next/link";
import { personTitle, type Ride } from "@/lib/data";
import { placeById } from "@/lib/places";
import { formatClock, fullSegment, leavesIn, personById, rupees, segmentFare, segmentTimes, type Segment } from "@/lib/rides";
import { useNowMinutes } from "@/lib/store";
import { Avatar } from "./avatar";
import { ContactButtons } from "./contact-buttons";
import styles from "./request-card.module.css";

export function rideHref(ride: Ride, seg?: Segment) {
  const full = fullSegment(ride);
  if (!seg || (seg.from === full.from && seg.to === full.to)) return `/rides/${ride.id}`;
  return `/rides/${ride.id}?from=${seg.from}&to=${seg.to}`;
}

type Props = {
  ride: Ride;
  segment?: Segment;
  seatsLeft: number;
  /** The top pick for the rider's route: orange border, tag and Continue button. */
  best?: boolean;
  status?: "booked" | "mine";
  /** Fixed 280px card for the horizontal Requests row. */
  compact?: boolean;
  /**
   * Carousel mode: the card grows into the "best match" look (orange border, tag, orange button)
   * as it reaches the front, following the carousel's --focus value.
   */
  spotlight?: boolean;
  /** Tag shown above the driver in spotlight mode. */
  tag?: string;
  /** Seats you hold on this ride; shown instead of the seats still free. */
  bookedSeats?: number;
};

/** Figma request card (Rider Home › Requests). */
export function RequestCard({ ride, segment, seatsLeft, best, status, compact, spotlight, tag, bookedSeats }: Props) {
  const now = useNowMinutes();
  const seg = segment ?? fullSegment(ride);
  const driver = personById(ride.driverId)!;
  const { depart, arrive } = segmentTimes(ride, seg);
  const fare = segmentFare(ride, seg);
  const full = seatsLeft <= 0;

  const action = status === "booked" ? "Booked" : status === "mine" ? "Manage" : best ? "Continue" : "Request";

  return (
    <article
      className={`${styles.card} ${spotlight ? styles.spotlight : best ? styles.best : ""} ${compact ? styles.compact : ""} ${full && !status ? styles.full : ""}`}
    >
      <div className={`${styles.inner} ${best || spotlight ? styles.innerBest : ""}`}>
        {(best || spotlight) && (
          <div className={styles.tagWrap}>
            <div className={styles.tag}>
              {best ? (
                <img src="/figma/verify-tag.svg" alt="" width={24} height={24} />
              ) : (
                <span className={styles.tagDot}>
                  <img src="/figma/pickup-dot.svg" alt="" width={13} height={13} />
                </span>
              )}
              <span>{best ? "Best match for your route" : tag}</span>
            </div>
          </div>
        )}

        <div className={styles.driver}>
          <Avatar person={driver} size={44} />
          <div className={styles.driverText}>
            <div className={styles.who}>
              <div className={styles.nameRow}>
                <span className={styles.name}>{status === "mine" ? "You" : driver.name}</span>
                {driver.verified && <img src="/figma/verify-name.svg" alt="Verified" width={24} height={24} />}
              </div>
              <span className={styles.role}>{personTitle(driver)}</span>
            </div>
            <div className={styles.price}>
              <span className={`${styles.fare} tnum`}>{rupees(fare)}</span>
              <span className={styles.perSeat}>per seat</span>
            </div>
          </div>
        </div>

        <div className={styles.route}>
          <img src="/figma/route-line.svg" alt="" width={20.9677} height={32} className={styles.line} />
          <div className={styles.stop}>
            <span className={styles.place}>
              <img src="/figma/pickup-dot.svg" alt="" width={13} height={13} />
              {placeById[seg.from].name}
            </span>
            <span className={`${styles.time} tnum`}>{formatClock(depart)}</span>
          </div>
          <div className={`${styles.stop} ${styles.drop}`}>
            <span className={styles.place}>
              <img src="/figma/drop-dot.svg" alt="" width={11.982} height={11.982} />
              {placeById[seg.to].name}
            </span>
            <span className={`${styles.time} tnum`}>{formatClock(arrive)}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.when}>
            <img src="/figma/clock.svg" alt="" width={16} height={16} />
            <span className={styles.whenText}>{leavesIn(ride, depart, now)}</span>
          </span>
          <span className={styles.seats}>
            <span className={styles.seatIcon}>
              <img src="/figma/seat.svg" alt="" width={9.5} height={11.5} />
            </span>
            {bookedSeats
              ? `${bookedSeats} seat${bookedSeats === 1 ? "" : "s"} booked`
              : full
                ? "Full"
                : `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"}`}
          </span>
          {bookedSeats ? (
            <>
              {/* Your booking: call or chat with the driver; the rest of the card opens the ride. */}
              <Link href={rideHref(ride, segment)} className={styles.cover} aria-label={`Open ride with ${driver.name}`} />
              <ContactButtons driver={driver} rideId={ride.id} />
            </>
          ) : (
            <Link href={rideHref(ride, segment)} className={`${styles.action} ${best && !spotlight ? styles.actionBest : ""}`}>
              {action}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
