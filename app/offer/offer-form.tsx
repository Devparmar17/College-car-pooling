"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { me, myVehicle, prefLabels, type Day, type Pref, type Vehicle } from "@/lib/data";
import { FUEL_PER_KM, fuelCost, fuelShare } from "@/lib/fare";
import { isPlaceId, placeById, places, placesAlong, routeKm, type PlaceId } from "@/lib/places";
import { dayLabels, formatClock, rupees, toMinutes } from "@/lib/rides";
import { actions, useHydrated, useNowMinutes, useStore } from "@/lib/store";
import { BuildingIcon, CarIcon, CheckIcon, HomeIcon, ScooterIcon, SwapIcon } from "../ui/icons";
import { RequestsBanner } from "../ui/requests-banner";
import styles from "./offer.module.css";

const allPrefs = Object.keys(prefLabels) as Pref[];

const CAMPUS: PlaceId = "indus";
const MORNING = ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00"];
const EVENING = ["16:30", "17:00", "17:30", "18:00", "18:30", "19:00"];


export function OfferForm() {
  const params = useSearchParams();
  const router = useRouter();
  const fromParam = params.get("from");
  const toParam = params.get("to");
  const dayParam = params.has("day") ? Number(params.get("day")) : 1;
  // Arrived here straight from verification on Profile.
  const justVerified = params.has("verified");

  const [from, setFrom] = useState<PlaceId>(isPlaceId(fromParam) ? fromParam : me.home);
  const [to, setTo] = useState<PlaceId>(isPlaceId(toParam) ? toParam : "indus");
  const [skipped, setSkipped] = useState<PlaceId[]>([]);
  const [day, setDay] = useState<Day>([0, 1, 2].includes(dayParam) ? (dayParam as Day) : 1);
  const [time, setTime] = useState("08:00");
  const [customTime, setCustomTime] = useState(false);
  const now = useNowMinutes();
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
  // Only riders pay; you drive.
  const riders = seatCount;
  const fare = fuelShare(fuel, riders);
  // Usual departure times: mornings into campus, evenings back home.
  const slots = to === CAMPUS ? MORNING : EVENING;
  const past = day === 0 && now !== null && /^\d\d:\d\d$/.test(time) && toMinutes(time) <= now;
  const valid = !!vehicle && from !== to && /^\d\d:\d\d$/.test(time) && !past;

  // A new route clears skipped pickups, and a change of direction moves the time to fit
  // (morning into campus, evening home), unless you set your own.
  function setRoute(a: PlaceId, b: PlaceId) {
    setFrom(a);
    setTo(b);
    setSkipped([]);
    if (customTime) return;
    if (b === CAMPUS && !MORNING.includes(time)) setTime("08:00");
    if (b !== CAMPUS && !EVENING.includes(time)) setTime("17:00");
  }
  // Unverified drivers see the form but can't touch it (on the server render too).
  const locked = !hydrated || !verified;

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
      {hydrated && verified && justVerified && (
        <div className={styles.welcome} role="status">
          <span className={styles.welcomeIcon} aria-hidden>
            ✓
          </span>
          <div>
            <strong>You&apos;re a verified driver</strong>
            <span>Your {myVehicle.model} is ready. Pick your route and time, then publish your first ride.</span>
          </div>
        </div>
      )}
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
      {/* Everything stays locked until the licence and RC are verified. */}
      <fieldset className={styles.lockable} disabled={locked}>
      <section className={`card ${styles.section}`}>
        <h2 className="section-title">Route</h2>
        {/* The two trips nearly every driver makes, one tap each. */}
        <div className={styles.quickRoutes}>
          <button type="button" aria-pressed={from === me.home && to === CAMPUS} onClick={() => setRoute(me.home, CAMPUS)}>
            <HomeIcon size={16} /> Home → Campus
          </button>
          <button type="button" aria-pressed={from === CAMPUS && to === me.home} onClick={() => setRoute(CAMPUS, me.home)}>
            <BuildingIcon size={16} /> Campus → Home
          </button>
        </div>
        <label className="field">
          <span>Starting from</span>
          <select className="input" value={from} onChange={(e) => setRoute(e.target.value as PlaceId, to)}>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.toRow}>
          <label htmlFor="offer-to">Going to</label>
          <button type="button" className={styles.swapText} onClick={() => setRoute(to, from)}>
            <SwapIcon size={14} /> Swap
          </button>
        </div>
        <label className="field">
          <select id="offer-to" className="input" value={to} onChange={(e) => setRoute(from, e.target.value as PlaceId)}>
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
        <fieldset className={styles.times}>
          <legend>Leaving at</legend>
          <div className={styles.slots}>
            {slots.map((t) => {
              const gone = day === 0 && now !== null && toMinutes(t) <= now;
              return (
                <button
                  key={t}
                  type="button"
                  className={styles.slot}
                  aria-pressed={!customTime && time === t}
                  disabled={gone}
                  onClick={() => {
                    setTime(t);
                    setCustomTime(false);
                  }}
                >
                  {formatClock(toMinutes(t))}
                </button>
              );
            })}
            <button type="button" className={styles.slot} aria-pressed={customTime} onClick={() => setCustomTime(true)}>
              Other time
            </button>
          </div>
          {customTime && (
            <input
              className="input"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Leaving at, other time"
              required
            />
          )}
          {past && (
            <p className={styles.error} role="alert">
              {formatClock(toMinutes(time))} has already passed today. Pick a later time or Tomorrow.
            </p>
          )}
        </fieldset>
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
                {seatCount} rider{seatCount > 1 ? "s" : ""} · you don&apos;t pay
              </span>
            </dt>
            <dd className="tnum">
              ÷ {riders} rider{riders > 1 ? "s" : ""}
            </dd>
          </div>
          <div className={styles.splitTotal}>
            <dt>Each rider pays</dt>
            <dd key={fare} className="tnum">
              {rupees(fare)}
            </dd>
          </div>
        </dl>
        <p className="muted">
          {seatCount > 1 ? `That's when all ${seatCount} seats fill; with one rider it's ${rupees(fuelShare(fuel, 1))}. ` : ""}
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
      </fieldset>

      <div className={styles.submit}>
        <button className="btn btn-primary btn-block" disabled={!valid}>
          {hydrated && !verified
            ? "Verify your licence & RC to publish"
            : `Publish · ${dayLabels[day]} ${formatClock(toMinutes(time))} · ${rupees(fare)}/seat`}
        </button>
      </div>
    </form>
  );
}
