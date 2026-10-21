"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { me, type Day } from "@/lib/data";
import { pickupMatches, type Match } from "@/lib/geo";
import type { PlaceId } from "@/lib/places";
import { dayLabels } from "@/lib/rides";
import { BuildingIcon, HomeIcon, SwapIcon } from "./icons";
import { PlaceInput, placeValue, type PlaceValue } from "./place-input";
import styles from "./search-form.module.css";

/** A place from the URL: the pickup point, or the place typed near it ("Bodakdev", 1.1 km). */
export type PlaceParam = { pickup: PlaceId; name?: string; km?: number };

type Props = {
  from?: PlaceParam;
  to?: PlaceParam;
  day?: Day;
};

function initial(p?: PlaceParam): PlaceValue {
  if (!p) return placeValue(null);
  const point = pickupMatches.find((m) => m.pickup === p.pickup)!;
  const picked: Match = p.name ? { ...point, name: p.name, area: "", km: p.km ?? 0, isPickup: false } : point;
  return placeValue(picked);
}

const home = pickupMatches.find((m) => m.pickup === me.home)!;
const campus = pickupMatches.find((m) => m.pickup === "indus")!;

export function SearchForm({ from, to, day = 0 }: Props) {
  const [a, setA] = useState(() => initial(from));
  const [b, setB] = useState(() => initial(to));
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});
  const router = useRouter();

  function route(x: Match, y: Match) {
    setA(placeValue(x));
    setB(placeValue(y));
    setErrors({});
  }
  // Picking a day updates the results straight away, for the places picked so far.
  function showDay(e: ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(e.currentTarget.form!)) if (typeof v === "string" && v) params.set(k, v);
    router.replace(`/find?${params}`, { scroll: false });
  }

  const isRoute = (x: Match, y: Match) => a.picked?.name === x.name && b.picked?.name === y.name;

  // Text typed but not picked from the list can't be searched yet.
  function submit(e: FormEvent) {
    const next = {
      from: a.text.trim() && !a.picked ? "Pick a place from the list" : undefined,
      to: b.text.trim() && !b.picked ? "Pick a place from the list" : undefined,
    };
    const same = a.picked && b.picked && a.picked.pickup === b.picked.pickup;
    if (same) next.to = "This is near the same pickup point as From. Choose somewhere further.";
    setErrors(next);
    if (next.from || next.to) e.preventDefault();
  }

  return (
    <form action="/find" className={styles.form} onSubmit={submit}>
      <div className={styles.places}>
        <PlaceInput
          name="from"
          label="From"
          icon="/figma/pickup-dot.svg"
          value={a}
          error={errors.from}
          onChange={(v) => {
            setA(v);
            setErrors((x) => ({ ...x, from: undefined }));
          }}
        />
        <PlaceInput
          name="to"
          label="To"
          icon="/figma/drop-dot.svg"
          value={b}
          error={errors.to}
          onChange={(v) => {
            setB(v);
            setErrors((x) => ({ ...x, to: undefined }));
          }}
        />
        <button
          type="button"
          className={styles.swap}
          aria-label="Swap from and to"
          onClick={() => {
            setA(b);
            setB(a);
            setErrors({});
          }}
        >
          <SwapIcon size={18} />
        </button>
      </div>
      {/* The two trips nearly everyone makes, one tap each. */}
      <div className={styles.quick} aria-label="Quick routes">
        <button type="button" onClick={() => route(home, campus)} aria-pressed={isRoute(home, campus)}>
          <HomeIcon size={16} /> Home → Campus
        </button>
        <button type="button" onClick={() => route(campus, home)} aria-pressed={isRoute(campus, home)}>
          <BuildingIcon size={16} /> Campus → Home
        </button>
      </div>
      <div className="segmented" role="radiogroup" aria-label="Day">
        {([0, 1, 2] as Day[]).map((d) => (
          <label key={d}>
            <input type="radio" name="day" value={d} defaultChecked={d === day} onChange={showDay} />
            <span>{dayLabels[d]}</span>
          </label>
        ))}
      </div>
      <button className="btn btn-primary btn-block">Find rides</button>
    </form>
  );
}
