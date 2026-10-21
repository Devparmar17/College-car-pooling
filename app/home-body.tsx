"use client";

import { useState } from "react";
import type { Day } from "@/lib/data";
import { dayLabels } from "@/lib/rides";
import { useNowMinutes, useStore } from "@/lib/store";
import { HomeFeed, ridesToCampus } from "./home-feed";
import { NextRide } from "./next-ride";
import { RecentPlaces } from "./recent-places";
import { SearchBar } from "./ui/search-bar";
import styles from "./page.module.css";

/** Home below the greeting. One day choice drives the search, recent places and rides to campus. */
export function HomeBody() {
  const s = useStore();
  const now = useNowMinutes();
  // Until you pick a day: today, or tomorrow once today's rides to campus have all left.
  const [picked, setDay] = useState<Day | null>(null);
  const day: Day = picked ?? (now !== null && ridesToCampus(s, 0, now).length === 0 ? 1 : 0);

  return (
    <>
      <div className={styles.search}>
        <NextRide />
        <SearchBar day={day} />
        <div className="segmented" role="radiogroup" aria-label="Day">
          {([0, 1, 2] as Day[]).map((d) => (
            <label key={d}>
              <input type="radio" name="home-day" checked={day === d} onChange={() => setDay(d)} />
              <span>{dayLabels[d]}</span>
            </label>
          ))}
        </div>
        <RecentPlaces day={day} />
      </div>
      <HomeFeed day={day} onDay={setDay} />
    </>
  );
}
