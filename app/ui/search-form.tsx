"use client";

/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import { useState } from "react";
import type { Day } from "@/lib/data";
import { places, type PlaceId } from "@/lib/places";
import { dayLabels } from "@/lib/rides";
import { SwapIcon } from "./icons";
import styles from "./search-form.module.css";

type Props = {
  from?: PlaceId | "";
  to?: PlaceId | "";
  day?: Day;
};

export function SearchForm({ from = "", to = "", day = 0 }: Props) {
  const [a, setA] = useState<string>(from);
  const [b, setB] = useState<string>(to);

  return (
    <form action="/find" className={styles.form}>
      <div className={styles.places}>
        <img src="/figma/route-line.svg" alt="" width={20.9677} height={32} className={styles.line} />
        <label className={styles.place}>
          <img src="/figma/pickup-dot.svg" alt="" width={13} height={13} />
          <span className={styles.label}>From</span>
          <select name="from" value={a} onChange={(e) => setA(e.target.value)}>
            <option value="">Anywhere</option>
            {places.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === b}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.place}>
          <img src="/figma/drop-dot.svg" alt="" width={11.982} height={11.982} />
          <span className={styles.label}>To</span>
          <select name="to" value={b} onChange={(e) => setB(e.target.value)}>
            <option value="">Anywhere</option>
            {places.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === a}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={styles.swap}
          aria-label="Swap from and to"
          onClick={() => {
            setA(b);
            setB(a);
          }}
        >
          <SwapIcon size={18} />
        </button>
      </div>
      <div className="segmented" role="radiogroup" aria-label="Day">
        {([0, 1, 2] as Day[]).map((d) => (
          <label key={d}>
            <input type="radio" name="day" value={d} defaultChecked={d === day} />
            <span>{dayLabels[d]}</span>
          </label>
        ))}
      </div>
      <button className="btn btn-primary btn-block">Find rides</button>
    </form>
  );
}
