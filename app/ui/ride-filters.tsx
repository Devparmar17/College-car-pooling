"use client";

import type { ComponentType } from "react";
import { me, type Ride } from "@/lib/data";
import { personById } from "@/lib/rides";
import { BuildingIcon, CarIcon, GridIcon, RepeatIcon, ScooterIcon, WomanIcon } from "./icons";
import styles from "./ride-filters.module.css";

export type RideFilter = "all" | "daily" | "car" | "bike" | "women" | "dept";

const filters: { id: RideFilter; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { id: "all", label: "All rides", Icon: GridIcon },
  { id: "daily", label: "Daily rides", Icon: RepeatIcon },
  { id: "car", label: "Car", Icon: CarIcon },
  { id: "bike", label: "Bike", Icon: ScooterIcon },
  { id: "women", label: "Women pool", Icon: WomanIcon },
  { id: "dept", label: "My dept", Icon: BuildingIcon },
];

export function matchesFilter(ride: Ride, filter: RideFilter): boolean {
  switch (filter) {
    case "daily":
      return !!ride.daily;
    case "car":
    case "bike":
      return ride.vehicle.kind === filter;
    case "women":
      return ride.prefs.includes("women");
    case "dept":
      return personById(ride.driverId)?.dept === me.dept;
    default:
      return true;
  }
}

type Props = {
  value: RideFilter;
  onChange: (f: RideFilter) => void;
  /** Rides the filters apply to; each tile shows how many it would keep. */
  rides?: Ride[];
};

/** Ride filters as icon tiles, three to a row. */
export function RideFilters({ value, onChange, rides }: Props) {
  return (
    <div className={styles.grid} role="radiogroup" aria-label="Filter rides">
      {filters.map(({ id, label, Icon }) => {
        const count = rides?.filter((r) => matchesFilter(r, id)).length;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            aria-label={count === undefined ? label : `${label}, ${count} ride${count === 1 ? "" : "s"}`}
            className={`${styles.tile} ${count === 0 ? styles.empty : ""}`}
            onClick={() => onChange(id)}
          >
            <span className={styles.icon}>
              <Icon size={18} />
            </span>
            <span className={styles.text}>
              <span className={styles.label}>{label}</span>
              {count !== undefined && (
                <span className={`${styles.count} tnum`}>
                  {count} ride{count === 1 ? "" : "s"}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
