"use client";

/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { personTitle, prefLabels, UNIVERSITY } from "@/lib/data";
import { methodLabels } from "@/lib/payment";
import { isPlaceId, placeById } from "@/lib/places";
import {
  dayLabels,
  formatClock,
  fullSegment,
  matchSegment,
  personById,
  routeName,
  rupees,
  segmentFare,
  segmentKm,
  segmentStops,
  segmentTimes,
  timetable,
  hasLeft,
} from "@/lib/rides";
import {
  actions,
  bookingFor,
  findRide,
  isMine,
  MAX_UPCOMING,
  ridersOn,
  seatsLeft,
  upcomingBookings,
  useHydrated,
  useNowMinutes,
  useStore,
} from "@/lib/store";
import { Avatar } from "../../ui/avatar";
import { CarIcon, CheckIcon, ScooterIcon, SeatIcon, StarIcon } from "../../ui/icons";
import { ContactButtons } from "../../ui/contact-buttons";
import { RideMap } from "../../ui/ride-map";
import { RateDriver } from "../../ui/rate-driver";
import { ConfirmSheet } from "./confirm-sheet";
import { TripTracker } from "./trip-tracker";
import { DemoPanel } from "./demo-panel";
import { SosSheet } from "./sos-sheet";
import sos from "./sos-sheet.module.css";
import { DriverTrip } from "./driver-trip";
import { WithdrawSheet } from "./withdraw-sheet";
import { PassengerRequest } from "../../ui/passenger-request";
import { PageHeader } from "../../ui/page-header";
import styles from "./ride.module.css";

export function RideDetail({ id }: { id: string }) {
  const s = useStore();
  const hydrated = useHydrated();
  const now = useNowMinutes();
  const params = useSearchParams();
  // Arrived here right after publishing this ride from Offer.
  const justPublished = params.has("published");
  const router = useRouter();
  const [wantedSeats, setSeats] = useState(1);
  const [cancelling, setCancelling] = useState(false);
  const [justBooked, setJustBooked] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const closeSos = useCallback(() => setSosOpen(false), []);
  const closeConfirm = useCallback(() => setConfirming(false), []);
  const closeCancel = useCallback(() => setCancelling(false), []);

  const ride = findRide(s, id);
  if (!ride) {
    if (!hydrated) return <PageHeader title="Ride" back="/find" />;
    return (
      <>
        <PageHeader title="Ride not found" back="/find" />
        <div className={`card ${styles.missing}`}>
          <p>This ride was withdrawn or the link is wrong.</p>
          <Link href="/find" className="btn btn-primary">
            Find another ride
          </Link>
        </div>
      </>
    );
  }

  const mine = isMine(ride);
  const booking = bookingFor(s, ride.id);
  const payment = s.payments[ride.id];
  const drive = s.drives[ride.id];
  // Your ride is over: keep the summary and riders; the rest (map, car, seats) no longer helps.
  const done = mine && !!drive?.completedAt;
  // Riders hold at most two upcoming rides at once.
  const atLimit = !mine && !booking && upcomingBookings(s).length >= MAX_UPCOMING;
  const showSos = (!!booking && !s.trips[ride.id]?.completedAt && !payment) || (mine && !!drive?.startedAt && !drive.completedAt);
  const earnedHere = done
    ? ridersOn(s, ride).filter((q) => drive!.paid[q.id]?.status === "paid").reduce((sum, q) => sum + q.amount, 0)
    : 0;
  // Your ride: seat requests waiting first, then the ones you've answered.
  const rideRequests = s.requests
    .filter((r) => r.rideId === ride.id && r.kind === "seat")
    .sort((a, b) => +(b.status === "pending") - +(a.status === "pending"));
  const fromParam = params.get("from");
  const toParam = params.get("to");
  const seg =
    booking?.segment ??
    matchSegment(ride, isPlaceId(fromParam) ? fromParam : undefined, isPlaceId(toParam) ? toParam : undefined) ??
    fullSegment(ride);
  const stops = segmentStops(ride, seg);
  const driver = personById(ride.driverId)!;
  const { depart, arrive } = segmentTimes(ride, seg);
  const km = segmentKm(ride, seg);
  const left = seatsLeft(s, ride);
  const gone = hasLeft(ride, seg, now);
  const maxSeats = Math.min(left, 4);
  const seats = Math.max(1, Math.min(wantedSeats, maxSeats));
  // Each seat is an equal share of the fuel among everyone in the car, so more seats cost less each.
  const fare = booking ? booking.fare : segmentFare(ride, seg, seats);
  // Seats can be picked on the map while you can still book this ride.

  const times = timetable(ride);
  const fromIdx = ride.stops.indexOf(seg.from);
  const toIdx = ride.stops.lastIndexOf(seg.to);

  const back = booking || mine ? "/trips" : `/find?from=${seg.from}&to=${seg.to}&day=${ride.day}`;

  function book() {
    setConfirming(false);
    actions.book({ rideId: ride!.id, seats, segment: seg, fare });
    setJustBooked(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Only drivers can call a ride off; a booked seat can't be cancelled from the rider side.
  // The driver confirms in a sheet; riders on the ride are told straight away.
  function withdraw(reason: string) {
    actions.withdraw(ride!.id, reason);
    router.push("/earnings");
  }

  return (
    <div className={styles.page}>
      {/* A short title; the full route sits in the time card below, where it can wrap. */}
      <PageHeader
        title={mine ? "Your ride" : booking ? "Your booked ride" : "Ride details"}
        back={back}
        action={
          showSos && (
            <button type="button" className={sos.sos} onClick={() => setSosOpen(true)} aria-label="SOS, emergency help">
              SOS
            </button>
          )
        }
      />

      {justPublished && mine && !drive?.startedAt && (
        <div className={styles.banner} role="status">
          <CheckIcon size={20} />
          <span>
            <strong>Ride published.</strong> Riders on your route can request a seat now.
          </span>
        </div>
      )}

      {justBooked && booking && (
        <div className={styles.banner} role="status">
          <CheckIcon size={20} />
          <span>
            You&apos;re in. Be at <strong>{placeById[seg.from].name}</strong> by{" "}
            <strong>{formatClock(depart - 2)}</strong>.
          </span>
        </div>
      )}

      <div className={styles.cols}>
        <div className={styles.colMain}>
          {!done && (
            <section className={styles.mapSection}>
              <RideMap stops={ride.stops} pickup={seg.from} dropoff={seg.to} driving={mine} />
            </section>
          )}

          <section className={`card ${styles.summary}`}>
            <div className={styles.day}>{dayLabels[ride.day]}</div>
            <p className={styles.routeLine}>{routeName(stops)}</p>
            <div className={`${styles.clock} tnum`}>
              {formatClock(depart)} <span className="muted">→</span> {formatClock(arrive)}
            </div>
            <div className={styles.facts}>
              <span className="tnum">{km.toFixed(1)} km</span>
              <span className="tnum">{arrive - depart} min</span>
              <span className="tnum">
                {mine ? `${ride.seatsTaken}/${ride.seatsTotal} seats booked` : `${rupees(fare)} per seat`}
              </span>
              {!mine && !booking && left > 0 && (
                <span className="tnum">
                  {left} seat{left === 1 ? "" : "s"} left
                </span>
              )}
            </div>
          </section>

          {booking && <TripTracker ride={ride} booking={booking} />}
          {booking && <DemoPanel ride={ride} />}
          {mine && <DriverTrip ride={ride} />}

          {/* Your ride: passenger requests near the top, so you don't scroll to find them. */}
          {mine && !drive?.startedAt && (rideRequests.length > 0 || justPublished) && (
            <section className={styles.requests}>
              <h2 className="section-title">Passenger requests</h2>
              {rideRequests.length ? (
                rideRequests.map((r) => <PassengerRequest key={r.id} request={r} />)
              ) : (
                <p className={styles.waitingRequests}>Riders on your route can now ask to join. Their requests show up here.</p>
              )}
            </section>
          )}

          {!done && (
            <section className={`card ${styles.timeline}`}>
              <h2 className="section-title">Stops</h2>
              <ol>
                {times.map(({ place, at }, i) => {
                  const inSeg = i >= fromIdx && i <= toIdx;
                  const tag = i === fromIdx ? "Pickup" : i === toIdx ? "Drop-off" : null;
                  return (
                    <li key={place} className={inSeg ? styles.active : styles.dim}>
                      <span className={`${styles.at} tnum`}>{formatClock(at)}</span>
                      <span className={`${styles.node} ${tag ? styles.nodeEnd : ""}`} aria-hidden />
                      <span className={styles.stop}>
                        <strong>{placeById[place].name}</strong>
                        <span className="muted">{placeById[place].area}</span>
                      </span>
                      {tag && !mine && <span className="chip chip-brand">{tag}</span>}
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>
        <div className={styles.colSide}>
          {!mine && (
            <section className={`card ${styles.driver}`}>
              <Avatar person={driver} size={56} />
              <div className={styles.driverInfo}>
                <strong>{mine ? "You're driving" : driver.name}</strong>
                <span className={styles.rating}>
                  <StarIcon size={13} /> {driver.rating.toFixed(1)} · {driver.ridesShared} rides shared
                </span>
                <span className="muted">{personTitle(driver)}</span>
                {driver.verified && (
                  <span className={styles.verified}>
                    <img src="/figma/verified-small.svg" alt="" width={13.8884} height={13.8875} /> Verified by {UNIVERSITY}
                  </span>
                )}
              </div>
              {!mine && (
                <Link href={`/people/${driver.id}`} className={styles.profileLink}>
                  Profile
                </Link>
              )}
              {booking && (
                <div className={styles.contact}>
                  <ContactButtons driver={driver} rideId={ride.id} labelled />
                </div>
              )}
            </section>
          )}

          {!done && (
            <section className={`card ${styles.vehicle}`}>
              <div className={styles.vehicleRow}>
                {ride.vehicle.kind === "bike" ? <ScooterIcon size={24} /> : <CarIcon size={24} />}
                <div>
                  <strong>{ride.vehicle.model}</strong>
                  <div className="muted">{ride.vehicle.color}</div>
                </div>
                <span className={styles.plate}>{ride.vehicle.plate}</span>
              </div>
              {ride.prefs.length > 0 && (
                <div className={styles.prefs}>
                  {ride.prefs.map((p) => (
                    <span key={p} className={`chip ${p === "women" ? "chip-women" : ""}`}>
                      {prefLabels[p]}
                    </span>
                  ))}
                </div>
              )}
              {ride.prefs.includes("women") && !mine && (
                <p className={styles.notice}>Only women riders can book this ride. The driver checks at pickup.</p>
              )}
              {ride.note && <blockquote className={styles.note}>“{ride.note}”</blockquote>}
            </section>
          )}

          {!done && (booking || mine) && (
            <section className={`card ${styles.seats}`}>
              <h2 className="section-title">Seats</h2>
              <div className={styles.seatRow}>
                {Array.from({ length: ride.seatsTotal }, (_, i) => {
                  const yours = booking?.seats ?? 0;
                  const state = i < ride.seatsTaken ? "taken" : i < ride.seatsTaken + yours ? "yours" : "free";
                  const label = { taken: "Taken", yours: "You", free: "Available" }[state];
                  return (
                    <span key={i} className={`${styles.seat} ${styles[state]}`}>
                      <SeatIcon size={22} />
                      <span>{label}</span>
                    </span>
                  );
                })}
              </div>
              {booking && !gone && (
                <div className={styles.seatActions}>
                  {left > 0 && booking.seats < 4 && (
                    <button type="button" className={styles.addSeat} onClick={() => actions.addSeat(ride.id)}>
                      + Add a seat · {rupees(segmentFare(ride, seg, booking.seats + 1) * (booking.seats + 1))} total
                    </button>
                  )}
                  {/* Extra seats can be given back; the booking itself stays (riders can't cancel). */}
                  {booking.seats > 1 && (
                    <button type="button" className={styles.removeSeat} onClick={() => actions.removeSeat(ride.id)}>
                      − Remove a seat · {rupees(segmentFare(ride, seg, booking.seats - 1) * (booking.seats - 1))} total
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          {booking && (payment || s.trips[ride.id]?.completedAt) && <RateDriver rideId={ride.id} driver={driver} />}

          <div className={styles.bar}>
            {mine ? (
              <>
                <div className={styles.barInfo}>
                  <strong className="tnum">
                    {done ? `${rupees(earnedHere)} earned` : `${ride.seatsTaken}/${ride.seatsTotal} booked`}
                  </strong>
                  <span className="muted">{done ? "Ride complete" : "Your ride"}</span>
                </div>
                {/* Once you've set off, the ride can't be called off; once it's over, head back. */}
                {done ? (
                  <Link href="/earnings" className="btn btn-dark">
                    Back to Earnings
                  </Link>
                ) : drive?.startedAt ? (
                  <span className={styles.paid}>Trip in progress</span>
                ) : (
                  <button className="btn btn-danger" onClick={() => setCancelling(true)}>
                    Cancel ride
                  </button>
                )}
              </>
            ) : booking ? (
              <>
                <div className={styles.barInfo}>
                  <strong className="tnum">
                    {booking.seats} seat{booking.seats > 1 ? "s" : ""} · {rupees(booking.fare * booking.seats)}
                  </strong>
                  {payment ? (
                    <span className={styles.paid}>
                      {payment.status === "pending"
                        ? "Cash · waiting for the driver to confirm"
                        : payment.status === "settle-requested"
                          ? "Settle-up · waiting for the driver to accept"
                          : payment.status === "settle-up"
                            ? "Settle-up accepted ✓"
                          : `Paid ✓ · ${methodLabels[payment.method]}`}
                    </span>
                  ) : (
                    <Link href={`/rides/${ride.id}/complete`} className={styles.payLink}>
                      Trip done? Pay now →
                    </Link>
                  )}
                </div>
                {/* Riders can't cancel a booked seat; they talk to the driver instead. */}
                <Link href={`/rides/${ride.id}/chat`} className="btn btn-primary">
                  Chat with {driver.name.split(" ")[0]}
                </Link>
              </>
            ) : gone ? (
              <button className="btn btn-block" disabled>
                This ride left at {formatClock(depart)}
              </button>
            ) : atLimit ? (
              <div className={styles.limit}>
                <strong>You have {MAX_UPCOMING} upcoming rides</strong>
                <span>Finish one before booking another.</span>
              </div>
            ) : left > 0 ? (
              <>
                <div className={styles.stepper} role="group" aria-label="Seats to book">
                  <button onClick={() => setSeats(Math.max(1, seats - 1))} disabled={seats <= 1} aria-label="One seat fewer">
                    −
                  </button>
                  <span key={seats} className="tnum" aria-live="polite">
                    {seats}
                  </span>
                  <button
                    onClick={() => setSeats(Math.min(maxSeats, seats + 1))}
                    disabled={seats >= maxSeats}
                    aria-label="One seat more"
                  >
                    +
                  </button>
                </div>
                <button className={`btn btn-primary ${styles.bookBtn}`} onClick={() => setConfirming(true)}>
                  Book {seats > 1 ? `${seats} seats` : "seat"} · <span className="tnum">{rupees(fare * seats)}</span>
                </button>
              </>
            ) : (
              <button className="btn btn-block" disabled>
                This ride is full
              </button>
            )}
          </div>
        </div>
      </div>
      {confirming && (
        <ConfirmSheet
          driver={driver}
          vehicle={`${ride.vehicle.model} · ${ride.vehicle.plate}`}
          day={dayLabels[ride.day]}
          pickup={{ name: placeById[seg.from].name, time: formatClock(depart) }}
          dropoff={{ name: placeById[seg.to].name, time: formatClock(arrive) }}
          seats={seats}
          fare={fare}
          onConfirm={book}
          onClose={closeConfirm}
        />
      )}
      {sosOpen && (
        <SosSheet
          ride={ride}
          driver={driver}
          route={routeName(stops)}
          when={`${dayLabels[ride.day]}, ${formatClock(depart)}`}
          onClose={closeSos}
        />
      )}
      {cancelling && (
        <WithdrawSheet
          route={`${placeById[ride.stops[0]].name} → ${placeById[ride.stops[ride.stops.length - 1]].name}`}
          when={`${dayLabels[ride.day]}, ${formatClock(times[0].at)}`}
          riders={[...new Set(rideRequests.filter((r) => r.status !== "declined").map((r) => r.riderId))].map((id) => personById(id)!)}
          onConfirm={withdraw}
          onClose={closeCancel}
        />
      )}
    </div>
  );
}
