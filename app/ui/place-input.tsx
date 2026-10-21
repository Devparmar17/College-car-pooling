"use client";

/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import { useEffect, useId, useRef, useState } from "react";
import { formatKm, pickupMatches, pickupName, searchLocal, searchOnline, toMatch, type Match } from "@/lib/geo";
import styles from "./place-input.module.css";

/** What's in a From/To box: the text, and the place picked for it (if any). */
export type PlaceValue = { text: string; picked: Match | null };

export function placeValue(picked: Match | null): PlaceValue {
  return { text: picked?.name ?? "", picked };
}

/** Further than this from every pickup point, the suggestion says so. */
const FAR_KM = 5;
const MAX_RESULTS = 8;

type Props = {
  name: "from" | "to";
  label: string;
  icon: string;
  value: PlaceValue;
  onChange: (v: PlaceValue) => void;
  error?: string;
};

/**
 * Type any place — an area, society or landmark — and pick it; the search then uses the
 * UniGo pickup point nearest to it. Empty means "Anywhere".
 */
export function PlaceInput({ name, label, icon, value, onChange, error }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  // "Use my current location" only makes sense for where you start from.
  const locate = name === "from";
  const first = locate ? 0 : 1;
  const [active, setActive] = useState(first);
  const [online, setOnline] = useState<{ query: string; results: Match[] }>({ query: "", results: [] });
  const [locating, setLocating] = useState<"idle" | "busy" | "denied">("idle");

  const query = value.picked ? "" : value.text.trim();
  const searching = query.length >= 3 && online.query !== query;

  // OpenStreetMap search for anything the built-in list doesn't know, a moment after typing stops.
  useEffect(() => {
    if (query.length < 3) return;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      searchOnline(query, ctrl.signal)
        .then((results) => setOnline({ query, results }))
        .catch(() => setOnline({ query, results: [] }));
    }, 350);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  const local = searchLocal(query);
  const seen = new Set(local.map((m) => m.name.toLowerCase()));
  const extra = online.query === query ? online.results.filter((m) => !seen.has(m.name.toLowerCase())) : [];
  const results = (query ? [...local, ...extra] : pickupMatches).slice(0, MAX_RESULTS);
  // Row 0 is "Use my current location" (From only); rows 1… are the results.
  const last = results.length;

  function pick(m: Match) {
    onChange({ text: m.name, picked: m });
    setOpen(false);
  }

  function locateMe() {
    if (!navigator.geolocation) return setLocating("denied");
    setLocating("busy");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating("idle");
        pick(toMatch({ name: "Current location", area: "Where you are now", lat: pos.coords.latitude, lng: pos.coords.longitude }));
      },
      () => setLocating("denied"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function choose(i: number) {
    if (i === 0) locateMe();
    else if (results[i - 1]) pick(results[i - 1]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => {
        const next = a + (e.key === "ArrowDown" ? 1 : -1);
        return next > last ? first : next < first ? last : next;
      });
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      choose(active === 0 && (!locate || (query && results.length)) ? 1 : active);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const picked = value.picked;
  const showNearest = picked && !picked.isPickup;

  return (
    // Tapping anywhere on the field (not just the text line) puts the cursor in it.
    <div
      className={`${styles.field} ${styles[name]} ${error ? styles.invalid : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) inputRef.current?.focus();
      }}
    >
      <img src={icon} alt="" width={13} height={13} className={styles.icon} />
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        className={styles.input}
        value={value.text}
        placeholder={locate ? "Where from? e.g. Bodakdev" : "Where to? e.g. Indus University"}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        aria-invalid={!!error}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          onChange({ text: e.target.value, picked: null });
          setOpen(true);
          setActive(first);
          setLocating("idle");
        }}
      />
      {value.text && (
        <button
          type="button"
          className={styles.clear}
          aria-label={`Clear ${label}`}
          onClick={() => {
            onChange({ text: "", picked: null });
            inputRef.current?.focus();
          }}
        >
          ✕
        </button>
      )}

      {/* The search runs from the nearest pickup point: say which, and how far. */}
      {showNearest && (
        <p className={`${styles.nearest} ${picked.km > FAR_KM ? styles.far : ""}`}>
          Nearest pickup: <strong>{pickupName(picked.pickup)}</strong> · {formatKm(picked.km)} away
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {/* What the search page reads: the pickup id, plus the typed name to show back. */}
      <input type="hidden" name={name} value={picked?.pickup ?? ""} />
      <input type="hidden" name={`${name}Name`} value={showNearest ? picked.name : ""} disabled={!showNearest} />
      <input type="hidden" name={`${name}Km`} value={showNearest ? picked.km.toFixed(2) : ""} disabled={!showNearest} />

      {open && (
        <ul id={listId} role="listbox" className={styles.list} aria-label={`${label} suggestions`} onMouseDown={(e) => e.preventDefault()}>
          {locate && (
            <li
              id={`${id}-opt-0`}
              role="option"
              aria-selected={active === 0}
              className={`${styles.option} ${styles.locate}`}
              onClick={() => choose(0)}
              onMouseEnter={() => setActive(0)}
            >
              <span className={styles.pin} aria-hidden>
                ◎
              </span>
              <span className={styles.text}>
                <strong>{locating === "busy" ? "Finding you…" : "Use my current location"}</strong>
                <span>{locating === "denied" ? "Location is off. Type your area instead." : "We'll find the nearest pickup point"}</span>
              </span>
            </li>
          )}
          {!query && <li className={styles.heading}>{locate ? "Pickup points" : "Drop-off points"}</li>}
          {results.map((m, i) => (
            <li
              key={`${m.name}-${m.lat}`}
              id={`${id}-opt-${i + 1}`}
              role="option"
              aria-selected={active === i + 1}
              className={styles.option}
              onClick={() => choose(i + 1)}
              onMouseEnter={() => setActive(i + 1)}
            >
              <span className={`${styles.pin} ${m.isPickup ? styles.pinPickup : ""}`} aria-hidden>
                ●
              </span>
              <span className={styles.text}>
                <strong>{m.name}</strong>
                <span>{m.area}</span>
              </span>
              {m.isPickup ? (
                <span className={styles.tag}>Pickup point</span>
              ) : (
                <span className={`${styles.near} ${m.km > FAR_KM ? styles.far : ""}`}>
                  <span>Nearest pickup</span>
                  <strong>{pickupName(m.pickup)}</strong>
                  <span>{formatKm(m.km)} away</span>
                </span>
              )}
            </li>
          ))}
          {searching && <li className={styles.status}>Searching more places…</li>}
          {query && !searching && results.length === 0 && (
            <li className={styles.status}>No place called “{query}” in Ahmedabad. Try a nearby area or landmark.</li>
          )}
        </ul>
      )}
    </div>
  );
}
