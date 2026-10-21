"use client";

import Link from "next/link";
import { useState } from "react";
import { me, type Day } from "@/lib/data";
import { nearestKm } from "@/lib/places";
import { compareRides, dayInText, dayLabels, fullSegment, hasLeft } from "@/lib/rides";
import { allRides, bookingFor, isMine, seatsLeft, useNowMinutes, useStore, type State } from "@/lib/store";
import { Carousel } from "./ui/carousel";
import { RequestCard } from "./ui/request-card";
import { matchesFilter, RideFilters, type RideFilter } from "./ui/ride-filters";
import styles from "./home-feed.module.css";

const CAMPUS = "indus";

/** Every ride on `day` that can still be booked, to campus and back home, in time order. */
export function campusRides(s: State, day: Day, now: number | null) {
  return allRides(s)
    .filter((r) => r.day === day && !isMine(r) && (r.stops[0] === CAMPUS || r.stops[r.stops.length - 1] === CAMPUS))
    .filter((r) => !hasLeft(r, fullSegment(r), now))
    .map((ride) => ({ ride, km: nearestKm(ride.stops, me.home), toCampus: ride.stops[ride.stops.length - 1] === CAMPUS }))
    .sort((a, b) => compareRides(a.ride, b.ride));
}

/** Every available ride on the day picked on Home (to campus and back), in time order. */
export function HomeFeed({ day, onDay }: { day: Day; onDay: (d: Day) => void }) {
  const s = useStore();
  const now = useNowMinutes();
  const [filter, setFilter] = useState<RideFilter>("all");
  const title = "Available rides";

  const ranked = campusRides(s, day, now);
  // Best match: the first ride that passes right by your home.
  const bestId = ranked.find((r) => r.km === 0)?.ride.id;
  const shown = ranked.filter(({ ride }) => matchesFilter(ride, filter));
  const when = dayLabels[day].toLowerCase();

  return (
    // Filters sit inside the section they filter, under its title.
    <section className={styles.requests} aria-labelledby="rides-to-campus">
      <div className={styles.head}>
        <h2 id="rides-to-campus">
          {title} <span>{when}</span>
        </h2>
        <Link href={`/find?day=${day}`}>See all</Link>
      </div>
      {/* Nothing to filter: no filter choices. */}
      {ranked.length > 0 && <RideFilters value={filter} onChange={setFilter} rides={ranked.map((r) => r.ride)} />}
      {shown.length ? (
        <Carousel key={day} label={title}>
          {shown.map(({ ride, km, toCampus }) => (
            <RequestCard
              key={ride.id}
              ride={ride}
              seatsLeft={seatsLeft(s, ride)}
              best={ride.id === bestId}
              status={bookingFor(s, ride.id) ? "booked" : undefined}
              compact
              spotlight
              tag={
                km < 0.1
                  ? toCampus
                    ? "Picks up near your home"
                    : "Drops off near your home"
                  : `${toCampus ? "Pickup" : "Drop-off"} ${km.toFixed(1)} km from your home`
              }
            />
          ))}
        </Carousel>
      ) : (
        <div className={styles.empty}>
          <p>
            {ranked.length
              ? `No ${title.toLowerCase()} match this filter ${when}.`
              : day === 0
                ? `Today's ${title.toLowerCase()} have all left.`
                : `No ${title.toLowerCase()} ${when} yet.`}
          </p>
          {!ranked.length && day < 2 && (
            <button type="button" className="btn" onClick={() => onDay((day + 1) as Day)}>
              See rides for {dayInText[(day + 1) as Day]}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
