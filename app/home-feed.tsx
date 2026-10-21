"use client";

import Link from "next/link";
import { useState } from "react";
import { me, type Day } from "@/lib/data";
import { nearestKm } from "@/lib/places";
import { compareRides, dayLabels, fullSegment, hasLeft } from "@/lib/rides";
import { allRides, bookingFor, isMine, seatsLeft, useNowMinutes, useStore, type State } from "@/lib/store";
import { Carousel } from "./ui/carousel";
import { RequestCard } from "./ui/request-card";
import { matchesFilter, RideFilters, type RideFilter } from "./ui/ride-filters";
import styles from "./home-feed.module.css";

const CAMPUS = "indus";

/** Rides into campus on `day` that can still be booked, those passing closest to home first. */
export function ridesToCampus(s: State, day: Day, now: number | null) {
  return allRides(s)
    .filter((r) => r.day === day && !isMine(r) && r.stops[r.stops.length - 1] === CAMPUS)
    .filter((r) => !hasLeft(r, fullSegment(r), now))
    .map((ride) => ({ ride, km: nearestKm(ride.stops, me.home) }))
    .sort((a, b) => a.km - b.km || compareRides(a.ride, b.ride));
}

/** Rides to campus on the day picked on Home, closest to your home first. */
export function HomeFeed({ day, onDay }: { day: Day; onDay: (d: Day) => void }) {
  const s = useStore();
  const now = useNowMinutes();
  const [filter, setFilter] = useState<RideFilter>("all");

  const ranked = ridesToCampus(s, day, now);
  const bestId = ranked[0]?.km === 0 ? ranked[0].ride.id : undefined;
  const shown = ranked.filter(({ ride }) => matchesFilter(ride, filter));
  const when = dayLabels[day].toLowerCase();

  return (
    // Filters sit inside the section they filter, under its title.
    <section className={styles.requests} aria-labelledby="rides-to-campus">
      <div className={styles.head}>
        <h2 id="rides-to-campus">
          Rides to campus <span>{when}</span>
        </h2>
        <Link href={`/find?to=${CAMPUS}&day=${day}`}>See all</Link>
      </div>
      {/* Nothing to filter: no filter choices. */}
      {ranked.length > 0 && <RideFilters value={filter} onChange={setFilter} rides={ranked.map((r) => r.ride)} />}
      {shown.length ? (
        <Carousel key={day} label="Rides to campus">
          {shown.map(({ ride, km }) => (
            <RequestCard
              key={ride.id}
              ride={ride}
              seatsLeft={seatsLeft(s, ride)}
              best={ride.id === bestId}
              status={bookingFor(s, ride.id) ? "booked" : undefined}
              compact
              spotlight
              tag={km < 0.1 ? "Picks up near your home" : `Pickup ${km.toFixed(1)} km from your home`}
            />
          ))}
        </Carousel>
      ) : (
        <div className={styles.empty}>
          <p>
            {ranked.length
              ? `No rides to campus match this filter ${when}.`
              : day === 0
                ? "Today's rides to campus have all left."
                : `No rides to campus ${when} yet.`}
          </p>
          {!ranked.length && day < 2 && (
            <button type="button" className="btn" onClick={() => onDay((day + 1) as Day)}>
              See {dayLabels[(day + 1) as Day].toLowerCase()}&apos;s rides
            </button>
          )}
        </div>
      )}
    </section>
  );
}
