"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { me, myVehicle, prefLabels, type Day, type Pref, type Vehicle } from "@/lib/data";
import { FUEL_PER_KM, fuelCost, fuelShare } from "@/lib/fare";
import { isPlaceId, placeById, places, placesAlong, routeKm, type PlaceId } from "@/lib/places";
import { dayLabels, formatClock, personById, rupees, toMinutes } from "@/lib/rides";
import { actions, bookedAround, useHydrated, useNowMinutes, useStore } from "@/lib/store";
import { BuildingIcon, CarIcon, CheckIcon, ScooterIcon } from "../ui/icons";
import { RequestsBanner } from "../ui/requests-banner";
import styles from "./offer.module.css";

const allPrefs = Object.keys(prefLabels) as Pref[];

/** Open the browser's clock for a time box; older browsers just focus it. */
function openTimePicker(el: HTMLInputElement) {
  try {
    el.showPicker();
  } catch {
    el.focus();
  }
}

const CAMPUS: PlaceId = "indus";
const MORNING = ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00"];
const EVENING = ["16:30", "17:00", "17:30", "18:00", "18:30", "19:00"];


/** The campus end of every ride: shown, not chosen. */
function FixedCampus({ label }: { label: string }) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className={styles.fixed}>
        <BuildingIcon size={18} />
        <strong>{placeById[CAMPUS].name}</strong>
        <span>Campus</span>
      </div>
    </div>
  );
}

export function OfferForm() {
  const params = useSearchParams();
  const router = useRouter();
  const fromParam = params.get("from");
  const toParam = params.get("to");
  const dayParam = params.has("day") ? Number(params.get("day")) : 1;
  // Arrived here straight from verification on Profile.
  const justVerified = params.has("verified");

  // Rides run between campus and your side of town; a link from elsewhere falls back to home → campus.
  const linked = isPlaceId(fromParam) && isPlaceId(toParam) && (fromParam === "indus") !== (toParam === "indus");
  const [from, setFrom] = useState<PlaceId>(linked ? (fromParam as PlaceId) : me.home);
  const [to, setTo] = useState<PlaceId>(linked ? (toParam as PlaceId) : "indus");
  const [skipped, setSkipped] = useState<PlaceId[]>([]);
  const [day, setDay] = useState<Day>([0, 1, 2].includes(dayParam) ? (dayParam as Day) : 1);
  const [time, setTime] = useState("08:00");
  const [customTime, setCustomTime] = useState(false);
  const timeInput = useRef<HTMLInputElement | null>(null);
  const pickerOnMount = useRef(false);
  const now = useNowMinutes();
  const [seats, setSeats] = useState(3);
  const [prefs, setPrefs] = useState<Pref[]>(["noSmoking"]);
  const [note, setNote] = useState("");

  const along = from !== to ? placesAlong(from, to) : [];
  const stops: PlaceId[] = [from, ...along.filter((p) => !skipped.includes(p)), to];
  const km = from !== to ? routeKm(stops) : 0;
  // Only verified drivers (licence + RC checked on Profile) can publish.
  const store = useStore();
  const verified = store.driver.status === "verified";
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
  // You can't drive while you're booked as a passenger at the same time.
  const clash = /^\d\d:\d\d$/.test(time) ? bookedAround(store, day, toMinutes(time)) : undefined;
  const valid = !!vehicle && from !== to && /^\d\d:\d\d$/.test(time) && !past && !clash;
  // One end is always campus; the other is your side of town.
  const toCampus = to === CAMPUS;
  const home = toCampus ? from : to;

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
    router.push(`/rides/${id}?published=1`);
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
        {/* Every ride starts or ends at campus: pick the direction, then only your side of town. */}
        <div className="segmented" role="radiogroup" aria-label="Direction">
          <label>
            <input type="radio" name="direction" checked={toCampus} onChange={() => setRoute(home, CAMPUS)} />
            <span>To campus</span>
          </label>
          <label>
            <input type="radio" name="direction" checked={!toCampus} onChange={() => setRoute(CAMPUS, home)} />
            <span>From campus</span>
          </label>
        </div>
        {!toCampus && <FixedCampus label="Pickup" />}
        <label className="field">
          <span>{toCampus ? "Starting from" : "Going to"}</span>
          <select
            className="input"
            value={home}
            onChange={(e) => {
              const p = e.target.value as PlaceId;
              setRoute(toCampus ? p : CAMPUS, toCampus ? CAMPUS : p);
            }}
          >
            {places
              .filter((p) => p.id !== CAMPUS)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        {toCampus && <FixedCampus label="Drop-off" />}

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
            <button
              type="button"
              className={styles.slot}
              aria-pressed={customTime}
              onClick={() => {
                // Straight to the clock: open it now if the box is there, or as soon as it appears.
                if (timeInput.current) return openTimePicker(timeInput.current);
                pickerOnMount.current = true;
                setCustomTime(true);
              }}
            >
              Other time
            </button>
          </div>
          {customTime && (
            <input
              ref={(el) => {
                timeInput.current = el;
                if (el && pickerOnMount.current) {
                  pickerOnMount.current = false;
                  openTimePicker(el);
                }
              }}
              className={`input ${styles.timeInput}`}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              // Tapping anywhere on the box opens the clock, not just the icon.
              onClick={(e) => openTimePicker(e.currentTarget)}
              aria-label="Leaving at, other time"
              required
            />
          )}
          {past && (
            <p className={styles.error} role="alert">
              {formatClock(toMinutes(time))} has already passed today. Pick a later time or Tomorrow.
            </p>
          )}
          {clash && !past && (
            <p className={styles.error} role="alert">
              You&apos;re riding with {personById(clash.driverId)?.name.split(" ")[0]} around then ({dayLabels[clash.day].toLowerCase()},{" "}
              {formatClock(toMinutes(clash.time))}). Pick another time to drive.
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
