"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { me, type Day } from "@/lib/data";
import { isPlaceId, nearestKm, placeById } from "@/lib/places";
import { dayLabels, hasLeft, matchSegment, segmentFare } from "@/lib/rides";
import { allRides, bookingFor, isMine, seatsLeft, useNowMinutes, useStore } from "@/lib/store";
import { RequestCard } from "../ui/request-card";
import { SearchForm } from "../ui/search-form";
import styles from "./find.module.css";

export function FindView() {
  const params = useSearchParams();
  const fromParam = params.get("from");
  const toParam = params.get("to");
  const from = isPlaceId(fromParam) ? fromParam : undefined;
  const to = isPlaceId(toParam) ? toParam : undefined;
  // A place typed near a pickup point ("Bodakdev", 1.1 km from Vastrapur Lake), to show it back.
  const fromName = from ? params.get("fromName") ?? undefined : undefined;
  const toName = to ? params.get("toName") ?? undefined : undefined;
  const fromKm = Number(params.get("fromKm")) || undefined;
  const toKm = Number(params.get("toKm")) || undefined;
  const dayParam = Number(params.get("day"));
  const day = params.has("day") && [0, 1, 2].includes(dayParam) ? (dayParam as Day) : undefined;

  const s = useStore();
  const now = useNowMinutes();
  const [cheapest, setCheapest] = useState(false);

  const matches = allRides(s)
    .filter((r) => !isMine(r) && (day === undefined || r.day === day))
    .map((ride) => ({ ride, seg: matchSegment(ride, from, to) }))
    .filter((m): m is { ride: typeof m.ride; seg: NonNullable<typeof m.seg> } => m.seg !== null)
    // Rides that already left can no longer be booked; keep them only if you have a seat.
    .filter((m) => !hasLeft(m.ride, m.seg, now) || bookingFor(s, m.ride.id));

  const shown = matches
    .sort((a, b) => (cheapest ? segmentFare(a.ride, a.seg) - segmentFare(b.ride, b.seg) : 0));

  // Best match: a ride that starts at the rider's own pickup (or home, when searching from anywhere).
  const pickup = from ?? me.home;
  const best = shown.find(({ ride, seg }) => seg.from === pickup || (!from && nearestKm(ride.stops, me.home) === 0));

  const elsewhere =
    shown.length === 0 && day !== undefined
      ? allRides(s)
          .filter((r) => !isMine(r) && r.day !== day && matchSegment(r, from, to))
          .slice(0, 3)
      : [];

  return (
    <div className={`${styles.page} stagger`}>
      <aside className={styles.side}>
        <SearchForm
          key={params.toString()}
          from={from && { pickup: from, name: fromName, km: fromKm }}
          to={to && { pickup: to, name: toName, km: toKm }}
          day={day ?? 0}
        />
      </aside>

      <div className={styles.results}>
        <div className={styles.head}>
          <h2 aria-live="polite">
            {shown.length} ride{shown.length === 1 ? "" : "s"}
            <span>
              {" "}
              · {from ? (fromName ? `${fromName} (via ${placeById[from].name})` : placeById[from].name) : "Anywhere"} →{" "}
              {to ? (toName ? `${toName} (via ${placeById[to].name})` : placeById[to].name) : "Anywhere"},{" "}
              {day === undefined ? "any day" : dayLabels[day].toLowerCase()}
            </span>
          </h2>
          <button type="button" onClick={() => setCheapest(!cheapest)} aria-pressed={cheapest}>
            {cheapest ? "Cheapest first" : "Earliest first"}
          </button>
        </div>

        <div className={`${styles.list} stagger`}>
          {shown.map(({ ride, seg }) => (
            <RequestCard
              key={ride.id}
              ride={ride}
              segment={seg}
              seatsLeft={seatsLeft(s, ride)}
              best={ride.id === best?.ride.id}
              status={bookingFor(s, ride.id) ? "booked" : undefined}
            />
          ))}
        </div>

        {shown.length === 0 && (
          <div className={styles.empty}>
            <h3>No rides {day !== undefined ? dayLabels[day].toLowerCase() : "yet"} on this route</h3>
            <p>Driving this way yourself? Offer the commute and riders on the way can request a seat.</p>
            <Link
              href={`/offer?${new URLSearchParams({ ...(from && { from }), ...(to && { to }), ...(day !== undefined && { day: String(day) }) })}`}
              className="btn btn-primary"
            >
              Offer this commute
            </Link>
          </div>
        )}

        {elsewhere.length > 0 && (
          <section className={styles.list}>
            <h2 className="section-title">Same route, other days</h2>
            {elsewhere.map((ride) => (
              <RequestCard key={ride.id} ride={ride} segment={matchSegment(ride, from, to)!} seatsLeft={seatsLeft(s, ride)} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
