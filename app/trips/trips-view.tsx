"use client";

import Link from "next/link";
import { useState } from "react";
import { rideHistory } from "@/lib/history";
import { compareRides } from "@/lib/rides";
import { findRide, seatsLeft, useHydrated, useStore } from "@/lib/store";
import { RequestCard } from "../ui/request-card";
import { RideHistory } from "../ui/ride-history";
import styles from "./trips.module.css";

type Tab = "riding" | "driving";

const PREVIOUS = 2;

export function TripsView() {
  const s = useStore();
  const hydrated = useHydrated();
  const [picked, setTab] = useState<Tab | null>(null);
  // Opens on the side that matches the commute mode: riding when finding, driving when offering.
  const tab = picked ?? (s.mode === "offer" ? "driving" : "riding");

  const riding = s.bookings
    .map((b) => ({ b, ride: findRide(s, b.rideId) }))
    .filter((x) => x.ride !== undefined)
    .sort((x, y) => compareRides(x.ride!, y.ride!));
  const driving = [...s.offered].sort(compareRides);
  // The latest finished rides on the same side as the open tab.
  const previous = rideHistory.filter((r) => r.role === (tab === "riding" ? "rider" : "driver")).slice(0, PREVIOUS);

  return (
    <div className={`${styles.page} stagger`}>
      <div className="segmented" role="tablist" aria-label="Trips">
        <label>
          <input type="radio" name="tab" role="tab" checked={tab === "riding"} onChange={() => setTab("riding")} />
          <span>Riding{hydrated && riding.length > 0 && ` · ${riding.length}`}</span>
        </label>
        <label>
          <input type="radio" name="tab" role="tab" checked={tab === "driving"} onChange={() => setTab("driving")} />
          <span>Driving{hydrated && driving.length > 0 && ` · ${driving.length}`}</span>
        </label>
      </div>

      {!hydrated ? null : tab === "riding" ? (
        riding.length ? (
          <div className={`${styles.list} stagger`}>
            {riding.map(({ b, ride }) => (
              <RequestCard
                key={b.rideId}
                ride={ride!}
                segment={b.segment}
                seatsLeft={seatsLeft(s, ride!)}
                status="booked"
                bookedSeats={b.seats}
              />
            ))}
          </div>
        ) : (
          <Empty
            title="No seats booked yet"
            body="Rides from ISKCON, Ambli, Thaltej and Bopal leave for Indus University every morning."
            href="/find"
            cta="Find a ride"
          />
        )
      ) : driving.length ? (
        <div className={styles.list}>
          {driving.map((ride) => (
            <RequestCard key={ride.id} ride={ride} seatsLeft={seatsLeft(s, ride)} status="mine" />
          ))}
        </div>
      ) : (
        <Empty
          title="You're not driving anywhere yet"
          body="Post your daily commute and riders on the way can split the fuel."
          href="/offer"
          cta="Offer a ride"
        />
      )}

      {previous.length > 0 && (
        <section className={styles.previous}>
          <div className={styles.head}>
            <h2>Previous rides</h2>
            <Link href="/profile#history">See all</Link>
          </div>
          <RideHistory history={previous} first={PREVIOUS} />
        </section>
      )}
    </div>
  );
}

function Empty({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className={`card ${styles.empty}`}>
      <h2>{title}</h2>
      <p className="muted">{body}</p>
      <Link href={href} className="btn btn-primary">
        {cta}
      </Link>
    </div>
  );
}
