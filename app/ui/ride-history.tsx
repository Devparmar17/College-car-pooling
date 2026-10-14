"use client";

import { useState } from "react";
import { monthLabel, shortDate, type PastRide } from "@/lib/history";
import { placeById } from "@/lib/places";
import { formatClock, personById, rupees, toMinutes } from "@/lib/rides";
import styles from "./ride-history.module.css";

/** Finished rides, newest first, grouped by month. Shows `first` until expanded. */
export function RideHistory({ history, first = 5 }: { history: PastRide[]; first?: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? history : history.slice(0, first);

  const months: { label: string; rides: PastRide[] }[] = [];
  for (const r of shown) {
    const label = monthLabel(r.date);
    if (months.at(-1)?.label !== label) months.push({ label, rides: [] });
    months.at(-1)!.rides.push(r);
  }

  return (
    <div className={styles.history}>
      {months.map((m) => (
        <div key={m.label}>
          <h3 className={styles.month}>{m.label}</h3>
          <ul className={styles.historyList}>
            {m.rides.map((r) => {
              const [weekday, day] = shortDate(r.date).replace(",", "").split(" ");
              const driving = r.role === "driver";
              const amount = driving ? r.fare * r.riders : r.fare * r.seats;
              return (
                <li key={r.id} className={styles.historyRow}>
                  <span className={styles.day}>
                    <strong className="tnum">{day}</strong>
                    <span>{weekday}</span>
                  </span>
                  <span className={styles.trip}>
                    <strong>
                      {placeById[r.from].name} → {placeById[r.to].name}
                    </strong>
                    <span>
                      {driving
                        ? `You drove · ${r.riders} rider${r.riders === 1 ? "" : "s"}`
                        : `with ${personById(r.driverId)?.name ?? "a driver"}${r.seats > 1 ? ` · ${r.seats} seats` : ""}`}{" "}
                      · {formatClock(toMinutes(r.time))}
                    </span>
                  </span>
                  <span className={`${styles.amount} tnum ${driving ? styles.earned : ""}`}>
                    {driving ? "+" : "−"}
                    {rupees(amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {history.length > first && (
        <button type="button" className={styles.more} onClick={() => setAll(!all)} aria-expanded={all}>
          {all ? "Show less" : `Show all ${history.length} rides`}
        </button>
      )}
    </div>
  );
}
