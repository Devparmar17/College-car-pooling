"use client";

import Link from "next/link";
import { useState } from "react";
import { me, type Day } from "@/lib/data";
import { nearestKm } from "@/lib/places";
import { compareRides, fullSegment, hasLeft } from "@/lib/rides";
import { allRides, bookingFor, isMine, seatsLeft, useNowMinutes, useStore } from "@/lib/store";
import { Carousel } from "./ui/carousel";
import { RequestCard } from "./ui/request-card";
import { matchesFilter, RideFilters, type RideFilter } from "./ui/ride-filters";
import styles from "./home-feed.module.css";

const CAMPUS = "indus";

export function HomeFeed() {
  const s = useStore();
  const now = useNowMinutes();
  const [filter, setFilter] = useState<RideFilter>("all");

  // Rides into campus that can still be booked, those passing closest to home first.
  // Once today's have all left, tomorrow's take their place.
  const toCampus = (day: Day) =>
    allRides(s)
      .filter((r) => r.day === day && !isMine(r) && r.stops[r.stops.length - 1] === CAMPUS)
      .filter((r) => !hasLeft(r, fullSegment(r), now))
      .map((ride) => ({ ride, km: nearestKm(ride.stops, me.home) }))
      .sort((a, b) => a.km - b.km || compareRides(a.ride, b.ride));
  const today = toCampus(0);
  const ranked = today.length ? today : toCampus(1);
  const bestId = ranked[0]?.km === 0 ? ranked[0].ride.id : undefined;
  const shown = ranked.filter(({ ride }) => matchesFilter(ride, filter));
  const day = ranked[0]?.ride.day ?? 0;

  return (
    <>
      <RideFilters value={filter} onChange={setFilter} rides={ranked.map((r) => r.ride)} />

      <section className={styles.requests}>
        <div className={styles.head}>
          <h2>Requests</h2>
          <Link href={`/find?to=${CAMPUS}&day=${day}`}>see all</Link>
        </div>
        {shown.length ? (
          <Carousel label="Ride requests">
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
          <p className={styles.empty}>No rides to campus match this filter {day === 0 ? "today" : "tomorrow"}.</p>
        )}
      </section>
    </>
  );
}
