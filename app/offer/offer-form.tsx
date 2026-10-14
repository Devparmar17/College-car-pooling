"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { me, myVehicle, prefLabels, type Day, type Pref, type Vehicle } from "@/lib/data";
import { isPlaceId, placeById, places, placesAlong, routeKm, suggestedFare, type PlaceId } from "@/lib/places";
import { dayLabels, rupees } from "@/lib/rides";
import { actions, useHydrated, useStore } from "@/lib/store";
import styles from "./offer.module.css";

const allPrefs = Object.keys(prefLabels) as Pref[];

const NO_CAR: Vehicle = { kind: "car", model: "", color: "", plate: "" };

export function OfferForm() {
  const params = useSearchParams();
  const router = useRouter();
  const fromParam = params.get("from");
  const toParam = params.get("to");
  const dayParam = params.has("day") ? Number(params.get("day")) : 1;

  const [from, setFrom] = useState<PlaceId>(isPlaceId(fromParam) ? fromParam : me.home);
  const [to, setTo] = useState<PlaceId>(isPlaceId(toParam) ? toParam : "indus");
  const [skipped, setSkipped] = useState<PlaceId[]>([]);
  const [day, setDay] = useState<Day>([0, 1, 2].includes(dayParam) ? (dayParam as Day) : 1);
  const [time, setTime] = useState("08:00");
  // Your own edits; until then the form shows the RC-verified car (or nothing before verification).
  const [vehicleEdit, setVehicle] = useState<Vehicle | null>(null);
  const [seats, setSeats] = useState(3);
  const [fareInput, setFareInput] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Pref[]>(["noSmoking"]);
  const [note, setNote] = useState("");

  const along = from !== to ? placesAlong(from, to) : [];
  const stops: PlaceId[] = [from, ...along.filter((p) => !skipped.includes(p)), to];
  const km = from !== to ? routeKm(stops) : 0;
  const suggested = suggestedFare(km);
  const fare = fareInput === null ? suggested : Number(fareInput);
  // Only verified drivers (licence + RC checked on Profile) can publish.
  const verified = useStore().driver.status === "verified";
  const hydrated = useHydrated();
  const vehicle = vehicleEdit ?? (verified ? myVehicle : NO_CAR);
  const maxSeats = vehicle.kind === "bike" ? 1 : 4;
  const seatCount = Math.min(seats, maxSeats);
  const valid = verified && from !== to && /^\d\d:\d\d$/.test(time) && fare > 0 && vehicle.plate.trim() !== "";

  function toggle<T>(list: T[], item: T) {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const id = actions.publish({
      stops,
      day,
      time,
      seatsTotal: seatCount,
      fare,
      vehicle: { ...vehicle, plate: vehicle.plate.trim().toUpperCase() },
      prefs,
      note: note.trim() || undefined,
    });
    router.push(`/rides/${id}`);
  }

  return (
    <form className={`${styles.form} stagger`} onSubmit={submit}>
      {hydrated && !verified && (
        <div className={styles.verify}>
          <div>
            <strong>Verify to offer rides</strong>
            <span>Upload your driving licence and vehicle RC once. It takes a minute.</span>
          </div>
          <Link href="/profile#driver" className="btn btn-dark">
            Verify now
          </Link>
        </div>
      )}
      <section className={`card ${styles.section}`}>
        <h2 className="section-title">Route</h2>
        <label className="field">
          <span>Starting from</span>
          <select className="input" value={from} onChange={(e) => { setFrom(e.target.value as PlaceId); setSkipped([]); }}>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Going to</span>
          <select className="input" value={to} onChange={(e) => { setTo(e.target.value as PlaceId); setSkipped([]); }}>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {from === to && <p className={styles.error}>Pick a destination different from the start.</p>}

        {from !== to && (
          <>
            {along.length > 0 && (
              <fieldset className={styles.pickups}>
                <legend>Pickups on the way</legend>
                <p className="muted">Riders waiting here can book the part of the ride they need.</p>
                {along.map((p) => (
                  <label key={p} className={styles.check}>
                    <input
                      type="checkbox"
                      checked={!skipped.includes(p)}
                      onChange={() => setSkipped(toggle(skipped, p))}
                    />
                    <span>
                      <strong>{placeById[p].name}</strong>
                      <span className="muted">{placeById[p].area}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
          </>
        )}
      </section>

      <section className={`card ${styles.section}`}>
        <h2 className="section-title">When</h2>
        <div className="segmented" role="radiogroup" aria-label="Day">
          {([0, 1, 2] as Day[]).map((d) => (
            <label key={d}>
              <input type="radio" name="day" checked={day === d} onChange={() => setDay(d)} />
              <span>{dayLabels[d]}</span>
            </label>
          ))}
        </div>
        <label className="field">
          <span>Leaving at</span>
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </label>
      </section>

      <section className={`card ${styles.section}`}>
        <h2 className="section-title">Vehicle and seats</h2>
        <div className="segmented" role="radiogroup" aria-label="Vehicle type">
          {(["car", "bike"] as const).map((k) => (
            <label key={k}>
              <input
                type="radio"
                name="kind"
                checked={vehicle.kind === k}
                onChange={() =>
                  setVehicle(k === "car" ? (verified ? myVehicle : NO_CAR) : { kind: "bike", model: "", color: "", plate: "" })
                }
              />
              <span>{k === "car" ? "Car" : "Two-wheeler"}</span>
            </label>
          ))}
        </div>
        <div className={styles.grid2}>
          <label className="field">
            <span>Model</span>
            <input
              className="input"
              value={vehicle.model}
              placeholder={vehicle.kind === "car" ? "Maruti Swift" : "Honda Activa"}
              onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Colour</span>
            <input
              className="input"
              value={vehicle.color}
              placeholder="White"
              onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
            />
          </label>
        </div>
        <label className="field">
          <span>Number plate</span>
          <input
            className={`input ${styles.plate}`}
            value={vehicle.plate}
            placeholder="GJ 01 AB 1234"
            onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
            required
          />
        </label>
        <div className={styles.seatsRow}>
          <div>
            <strong>Seats for riders</strong>
            <div className="muted">{vehicle.kind === "bike" ? "One pillion seat" : "Up to 4"}</div>
          </div>
          <div className={styles.stepper} role="group" aria-label="Seats">
            <button type="button" onClick={() => setSeats(Math.max(1, seatCount - 1))} disabled={seatCount <= 1} aria-label="One seat fewer">
              −
            </button>
            <span key={seatCount} className={`tnum ${styles.count}`} aria-live="polite">
              {seatCount}
            </span>
            <button type="button" onClick={() => setSeats(Math.min(maxSeats, seatCount + 1))} disabled={seatCount >= maxSeats} aria-label="One seat more">
              +
            </button>
          </div>
        </div>
      </section>

      <section className={`card ${styles.section}`}>
        <h2 className="section-title">Price per seat</h2>
        <div className={styles.fareRow}>
          <span className={styles.rupee}>₹</span>
          <input
            className={`input tnum ${styles.fare}`}
            type="number"
            inputMode="numeric"
            min={10}
            max={500}
            step={5}
            value={fareInput ?? suggested}
            onChange={(e) => setFareInput(e.target.value)}
            aria-label="Price per seat in rupees"
          />
          {fareInput !== null && Number(fareInput) !== suggested && (
            <button type="button" className={styles.reset} onClick={() => setFareInput(null)}>
              Use {rupees(suggested)}
            </button>
          )}
        </div>
        <p className="muted">
          Suggested {rupees(suggested)} covers a fair share of fuel for {km.toFixed(1)} km. Riders joining at a pickup pay
          for the distance they travel.
        </p>
      </section>

      <section className={`card ${styles.section}`}>
        <h2 className="section-title">Preferences</h2>
        <div className={styles.prefs}>
          {allPrefs.map((p) => (
            <button
              key={p}
              type="button"
              className={styles.pref}
              aria-pressed={prefs.includes(p)}
              onClick={() => setPrefs(toggle(prefs, p))}
            >
              {prefLabels[p]}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Note for riders (optional)</span>
          <textarea
            className="input"
            value={note}
            maxLength={160}
            placeholder="Where exactly you'll wait, how long you can wait, anything riders should know."
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </section>

      <div className={styles.submit}>
        <button className="btn btn-primary btn-block" disabled={!valid}>
          {hydrated && !verified
            ? "Verify your licence & RC to publish"
            : `Publish ride · ${seatCount} seat${seatCount > 1 ? "s" : ""} at ${rupees(fare || 0)}`}
        </button>
      </div>
    </form>
  );
}
