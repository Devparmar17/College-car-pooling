"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { me, myVehicle, prefLabels, type Day, type Pref, type Vehicle } from "@/lib/data";
import { FUEL_PER_KM, fuelCost, fuelShare } from "@/lib/fare";
import { isPlaceId, placeById, places, placesAlong, routeKm, type PlaceId } from "@/lib/places";
import { dayLabels, rupees } from "@/lib/rides";
import { actions, useHydrated, useStore } from "@/lib/store";
import { CarIcon, CheckIcon, ScooterIcon } from "../ui/icons";
import { RequestsBanner } from "../ui/requests-banner";
import styles from "./offer.module.css";

const allPrefs = Object.keys(prefLabels) as Pref[];


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
  const [seats, setSeats] = useState(3);
  const [prefs, setPrefs] = useState<Pref[]>(["noSmoking"]);
  const [note, setNote] = useState("");

  const along = from !== to ? placesAlong(from, to) : [];
  const stops: PlaceId[] = [from, ...along.filter((p) => !skipped.includes(p)), to];
  const km = from !== to ? routeKm(stops) : 0;
  // Only verified drivers (licence + RC checked on Profile) can publish.
  const verified = useStore().driver.status === "verified";
  const hydrated = useHydrated();
  // The vehicle is whatever the verified RC says; nothing until then.
  const vehicle: Vehicle | null = verified ? myVehicle : null;
  const isBike = vehicle?.kind === "bike";
  const maxSeats = isBike ? 1 : 4;
  const seatCount = Math.min(seats, maxSeats);
  // Fuel for the route, shared by you and every seat you offer (priced as a car until the RC is verified).
  const kind = vehicle?.kind ?? "car";
  const fuel = fuelCost(km, kind);
  const people = 1 + seatCount;
  const fare = fuelShare(fuel, people);
  const valid = !!vehicle && from !== to && /^\d\d:\d\d$/.test(time);

  function toggle<T>(list: T[], item: T) {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid || !vehicle) return;
    const id = actions.publish({
      stops,
      day,
      time,
      seatsTotal: seatCount,
      fare,
      vehicle,
      prefs: isBike ? [] : prefs,
      note: isBike ? undefined : note.trim() || undefined,
    });
    router.push(`/rides/${id}`);
  }

  return (
    <form className={`${styles.form} stagger`} onSubmit={submit}>
      <RequestsBanner />
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
        {/* Type, model, colour and plate come from the verified RC; they can't be typed in. */}
        {vehicle ? (
          <div className={styles.rcVehicle}>
            <span className={styles.rcIcon}>{isBike ? <ScooterIcon size={24} /> : <CarIcon size={24} />}</span>
            <div className={styles.rcText}>
              <strong>{vehicle.model}</strong>
              <span>
                {vehicle.color} · {isBike ? "Two-wheeler" : "Car"}
              </span>
            </div>
            <span className={styles.plate}>{vehicle.plate}</span>
            <p className={styles.rcNote}>
              <CheckIcon size={14} /> From your verified RC.{" "}
              <Link href="/profile#driver">Different vehicle? Update RC</Link>
            </p>
          </div>
        ) : (
          <div className={`${styles.rcVehicle} ${styles.rcEmpty}`}>
            <span className={styles.rcIcon}>
              <CarIcon size={24} />
            </span>
            <div className={styles.rcText}>
              <strong>No vehicle yet</strong>
              <span>Your vehicle and number plate fill in from your RC once it&apos;s verified.</span>
            </div>
          </div>
        )}
        <div className={styles.seatsRow}>
          <div>
            <strong>Seats for riders</strong>
            <div className="muted">{isBike ? "One pillion seat" : "Up to 4"}</div>
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

      {/* Nobody sets the price: it's the trip's fuel, split equally by everyone in the vehicle. */}
      <section className={`card ${styles.section}`}>
        <h2 className="section-title">Fuel split</h2>
        <dl className={styles.split}>
          <div>
            <dt>
              Fuel for {km.toFixed(1)} km
              <span>
                {rupees(FUEL_PER_KM[kind])}/km · {isBike ? "two-wheeler" : "car"}
              </span>
            </dt>
            <dd className="tnum">{rupees(fuel)}</dd>
          </div>
          <div>
            <dt>
              Shared by
              <span>
                You + {seatCount} rider{seatCount > 1 ? "s" : ""}
              </span>
            </dt>
            <dd className="tnum">÷ {people} people</dd>
          </div>
          <div className={styles.splitTotal}>
            <dt>Each person pays</dt>
            <dd key={fare} className="tnum">
              {rupees(fare)}
            </dd>
          </div>
        </dl>
        <p className="muted">
          {seatCount > 1 ? `That's when all ${seatCount} seats fill; with one rider it's ${rupees(fuelShare(fuel, 2))} each. ` : ""}
          Riders joining at a pickup only pay for the distance they ride.
        </p>
      </section>

      {/* Car preferences (AC, luggage, music…) and the note don't apply to a two-wheeler. */}
      {!isBike && (
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
      )}

      <div className={styles.submit}>
        <button className="btn btn-primary btn-block" disabled={!valid}>
          {hydrated && !verified
            ? "Verify your licence & RC to publish"
            : `Publish ride · ${seatCount} seat${seatCount > 1 ? "s" : ""} · ${rupees(fare)} each`}
        </button>
      </div>
    </form>
  );
}
