"use client";

import { useSyncExternalStore } from "react";
import { me, ME_ID, seedRides, todaysDemoRides, type Person, type Ride } from "./data";
import { placeById } from "./places";
import type { TripState } from "./trip";
import { compareRides, dayLabels, formatClock, fullSegment, personById, segmentFare, segmentKm, segmentTimes, type Segment } from "./rides";

export type Booking = {
  rideId: string;
  seats: number;
  segment: Segment;
  fare: number;
  bookedAt: number;
};

export type Mode = "find" | "offer";

export type Message = {
  from: "me" | "driver";
  text: string;
  at: number;
};

export type Role = "Student" | "Faculty" | "Staff";

export type Account = {
  name: string;
  email: string;
  role: Role;
  dept: string;
  idNumber: string;
};

/** A document the driver uploaded. Only its details are kept; the file stays on the device. */
export type DriverDoc = { name: string; size: number };

export type DriverCheck = {
  licence: DriverDoc | null;
  rc: DriverDoc | null;
  status: "none" | "checking" | "verified";
};

export type PayMethod = "wallet" | "upi-app" | "upi-id" | "cash" | "settle-up";

/** How a rider paid for a ride. Cash waits for the driver to confirm; settle-up is billed monthly. */
export type Payment = {
  method: PayMethod;
  amount: number;
  at: number;
  /** pending: cash waiting for the driver · settle-requested: waiting for the driver to accept */
  status: "paid" | "pending" | "settle-requested" | "settle-up";
  /** When the driver confirmed the cash or accepted the settle-up. */
  answeredAt?: number;
  upiId?: string;
};

/**
 * Something a passenger asks you, the driver: a seat on a ride you offered, or adding a past
 * trip to their monthly settle-up. You accept or decline it.
 */
export type RideRequest = {
  id: string;
  kind: "seat" | "settle-up";
  rideId: string;
  riderId: string;
  seats: number;
  segment: Segment;
  /** Rupees for all their seats. */
  amount: number;
  /** For settle-up: which trip it's for, e.g. "Monday's ride". */
  trip?: string;
  at: number;
  status: "pending" | "accepted" | "declined";
  answeredAt?: number;
};

/**
 * A ride called off by its driver. Rider side: a driver cancelled the seat you booked.
 * Driver side: you withdrew a ride you were driving and your riders were told.
 */
/** How a passenger pays the driver at the end of a trip. */
export type RiderPayment = {
  method: "upi" | "cash" | "settle-up";
  status: "pending" | "paid";
  /** Demo: when a UPI payment lands. */
  dueAt?: number;
  at?: number;
};

/** Driver side of a ride you're driving: pickups, drop-off, payments and ratings, per accepted request. */
export type DriveState = {
  startedAt?: number;
  boarded: Record<string, "picked" | "noshow">;
  completedAt?: number;
  paid: Record<string, RiderPayment>;
  /** Your rating of each rider, per accepted request. */
  rated: Record<string, Rating>;
};

/** A rating someone gave you: as a rider (from your driver) or as a driver (from a rider). */
export type ReceivedRating = {
  id: string;
  rideId: string;
  fromId: string;
  as: "rider" | "driver";
  stars: number;
  tags: string[];
  comment: string;
  at: number;
};

export type Cancellation = {
  id: string;
  side: "rider" | "driver";
  rideId: string;
  driverId: string;
  segment: Segment;
  /** "Tomorrow, 8:15 AM" */
  when: string;
  reason: string;
  /** Driver side: the riders who were told. */
  told: string[];
  /** Rider side: Campus Wallet money returned. */
  refund?: number;
  at: number;
  /** The pop-up (rider) or toast (driver) has been seen. */
  seen: boolean;
};

/** Your rating of a driver after a trip. */
export type Rating = { stars: number; tags: string[]; comment: string; at: number };

/** A login or sign-up waiting for its emailed code. */
export type Pending =
  | { flow: "login"; email: string }
  | ({ flow: "signup" } & Account);

export type State = {
  bookings: Booking[];
  offered: Ride[];
  /** Last commute mode the rider used; picks the bottom bar's middle tab. */
  mode: Mode;
  /** Chat with the driver, per booked ride. */
  messages: Record<string, Message[]>;
  /** Details from sign-up; the demo account (Dharam) when null. */
  account: Account | null;
  /** Driving licence and vehicle RC, needed before offering rides. */
  driver: DriverCheck;
  /** Campus Wallet balance in rupees. */
  wallet: number;
  /** Fuel contributions, per ride. */
  payments: Record<string, Payment>;
  /** Live trip progress and completion, per booked ride. */
  trips: Record<string, TripState>;
  /** Your ratings of drivers, per ride. */
  ratings: Record<string, Rating>;
  /** Passengers' requests on the rides you drive, newest last. */
  requests: RideRequest[];
  /** Demo requests that haven't arrived yet (their `at` is in the future). */
  incoming: RideRequest[];
  /** Rides called off, newest last. */
  cancellations: Cancellation[];
  /** Demo: today's rides to campus, made fresh each day from the time the app was opened. */
  today: { date: string; rides: Ride[] } | null;
  /** Rides you're driving: trip progress and payments, per ride. */
  drives: Record<string, DriveState>;
  /** Ratings you've received; ones whose `at` is still ahead haven't arrived yet (demo). */
  received: ReceivedRating[];
  /** Notification ids already seen. */
  notifRead: string[];
  /** Show ride alerts as system notifications on this device. */
  alerts: boolean;
  pending: Pending | null;
};

const KEY = "unigo:v2";
const empty: State = {
  bookings: [],
  offered: [],
  mode: "find",
  messages: {},
  account: null,
  pending: null,
  driver: { licence: null, rc: null, status: "none" },
  wallet: 250,
  payments: {},
  notifRead: [],
  alerts: false,
  ratings: {},
  trips: {},
  requests: [],
  incoming: [],
  cancellations: [],
  today: null,
  drives: {},
  received: [],
};

// Demo review time before submitted documents count as verified.
const REVIEW_MS = 2500;

// The session lives in a cookie so proxy.ts can send signed-out visitors to /login before rendering.
const SESSION_COOKIE = "unigo_session";

export function hasSession() {
  return typeof document !== "undefined" && document.cookie.split("; ").some((c) => c.startsWith(`${SESSION_COOKIE}=`));
}

/** What a first visit starts with: one booked seat (tomorrow's r109), so My commutes isn't empty. */
const demo: State = {
  ...empty,
  bookings: [
    {
      rideId: "r109",
      seats: 1,
      segment: { from: "iskcon", to: "indus" },
      fare: segmentFare(seedRides.find((r) => r.id === "r109")!, { from: "iskcon", to: "indus" }),
      bookedAt: 0,
    },
  ],
  messages: {
    r109: [{ from: "driver", text: "Hi Dharam! I'll be at the ISKCON bus stop, Satellite side, by 8:13. White Creta.", at: 0 }],
  },
  // Ratings from past trips (see ride history).
  received: [
    { id: "rr1", rideId: "h12", fromId: "ketan", as: "rider", stars: 5, tags: ["On time", "Polite"], comment: "", at: 0 },
    { id: "rr2", rideId: "h07", fromId: "mehul", as: "rider", stars: 5, tags: ["Easy pickup"], comment: "Ready at the stop every time.", at: 0 },
    { id: "rr3", rideId: "h10", fromId: "aarav", as: "driver", stars: 5, tags: ["Safe driving", "On time"], comment: "", at: 0 },
    { id: "rr4", rideId: "h06", fromId: "riya", as: "driver", stars: 4, tags: ["Friendly"], comment: "Nice ride, AC was a bit low.", at: 0 },
  ],
};

let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const saved = raw ? JSON.parse(raw) : null;
    state = saved ? { ...empty, ...saved } : demo;
    // Saved before ratings existed: start with the demo's past ratings.
    if (saved && !saved.received) state = { ...state, received: demo.received };
    // A new day: fresh demo rides for today, and bookings on yesterday's ones are gone with them.
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (state.today?.date !== date) {
      state = { ...state, today: { date, rides: todaysDemoRides(date, now.getHours() * 60 + now.getMinutes()) } };
      state = { ...state, bookings: state.bookings.filter((b) => findRide(state, b.rideId)) };
    }
    // A review that was still running when the tab closed has finished by now.
    if (state.driver.status === "checking") state = { ...state, driver: { ...state.driver, status: "verified" } };
    // Same for drivers who were about to confirm cash or accept a settle-up request.
    const waiting = Object.entries(state.payments).filter(([, p]) => p.status === "pending" || p.status === "settle-requested");
    if (waiting.length) {
      const answered = waiting.map(([id, p]) => [id, { ...p, status: p.status === "pending" ? "paid" : "settle-up", answeredAt: Date.now() }]);
      state = { ...state, payments: { ...state.payments, ...Object.fromEntries(answered) } };
    }
    // Prices are the fuel share (no driver-set fares any more): bring saved bookings in line.
    state = {
      ...state,
      bookings: state.bookings.map((b) => {
        const ride = findRide(state, b.rideId);
        return ride ? { ...b, fare: segmentFare(ride, b.segment, b.seats) } : b;
      }),
    };
    // Data saved before chat existed: give the demo booking its opening message.
    if (state.bookings.some((b) => b.rideId === "r109") && !state.messages.r109) {
      state = { ...state, messages: { ...state.messages, r109: demo.messages.r109 } };
    }
  } catch {
    // Private mode or corrupt data: start fresh.
  }
  window.setInterval(deliverRequests, 1000);
}

function set(next: (s: State) => State) {
  load();
  state = next(state);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: keep the in-memory state for this tab.
  }
  listeners.forEach((l) => l());
}

/**
 * A system notification for ride alerts, when the rider switched them on and the browser allows it.
 * Goes through the service worker where there is one (Android Chrome needs that), else the page.
 */
async function systemAlert(title: string, body: string, url: string) {
  if (!state.alerts || typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const options = { body, icon: "/figma/unigo-logo.png", badge: "/figma/unigo-logo.png", tag: url, data: { url } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return void (await reg.showNotification(title, options));
    const n = new Notification(title, options);
    n.onclick = () => {
      window.focus();
      window.location.href = url;
    };
  } catch {
    // Notifications blocked or unsupported: the in-app list still has it.
  }
}

// Demo: after you publish a ride, two passengers on the route ask for a seat, and one asks
// to put an earlier trip with you on their monthly settle-up. They wait in `incoming` (saved,
// so they survive reloads) until they're due, then arrive with an alert.
const DEMO_RIDERS = ["riya", "aarav", "mehul", "ketanp"];
const DEMO_REQUEST_DELAYS = [4000, 9000, 14000];

function scheduleDemoRequests(rideId: string) {
  const ride = state.offered.find((r) => r.id === rideId);
  if (!ride) return;
  const to = ride.stops[ride.stops.length - 1];
  // Riders who live on the route first, then anyone.
  const riders = [...DEMO_RIDERS].sort((a, b) => +ride.stops.includes(personById(b)!.home) - +ride.stops.includes(personById(a)!.home));
  const used = new Set([...state.requests, ...state.incoming].map((r) => r.riderId));
  const pick = riders.filter((id) => !used.has(id)).concat(riders).slice(0, 3);
  const now = Date.now();

  const incoming = pick.map((riderId, i): RideRequest => {
    const home = personById(riderId)!.home;
    const kind = i === 2 ? "settle-up" : "seat";
    const segment = { from: ride.stops.slice(0, -1).includes(home) ? home : ride.stops[0], to };
    const seats = kind === "seat" && i === 1 && ride.seatsTotal > 1 ? 2 : 1;
    return {
      id: `q${now.toString(36)}${i}`,
      kind,
      rideId,
      riderId,
      seats,
      segment,
      amount: segmentFare(ride, segment, seats) * seats,
      trip: kind === "settle-up" ? "Monday's ride" : undefined,
      at: now + DEMO_REQUEST_DELAYS[i],
      status: "pending",
    };
  });
  set((s) => ({ ...s, incoming: [...s.incoming, ...incoming] }));
}

/** Move requests that are due into the inbox, and alert the driver. Runs every second. */
function deliverRequests() {
  deliverPayments();
  deliverRatings();
  const now = Date.now();
  const due = state.incoming.filter((r) => r.at <= now);
  if (!due.length) return;
  set((s) => ({ ...s, incoming: s.incoming.filter((r) => r.at > now), requests: [...s.requests, ...due] }));
  for (const req of due) {
    const name = personById(req.riderId)!.name.split(" ")[0];
    const ride = state.offered.find((r) => r.id === req.rideId);
    void systemAlert(
      req.kind === "seat" ? `${name} wants ${req.seats > 1 ? `${req.seats} seats` : "a seat"}` : `${name} sent a settle-up request`,
      req.kind === "seat" && ride
        ? `${placeById[req.segment.from].name} → ${placeById[req.segment.to].name} · ${dayLabels[ride.day]}, ${formatClock(segmentTimes(ride, req.segment).depart)}. Accept or decline.`
        : `₹${req.amount} for ${req.trip ?? "an earlier ride"}, on their monthly settle-up. Accept or decline.`,
      "/requests",
    );
  }
}

/** Demo: riders' UPI payments land a few seconds after the driver completes the ride. */
function deliverPayments() {
  const now = Date.now();
  const landed: { rideId: string; reqId: string }[] = [];
  for (const [rideId, d] of Object.entries(state.drives)) {
    for (const [reqId, pay] of Object.entries(d.paid)) {
      if (pay.method === "upi" && pay.status === "pending" && (pay.dueAt ?? 0) <= now) landed.push({ rideId, reqId });
    }
  }
  if (!landed.length) return;
  set((s) => {
    const drives = { ...s.drives };
    for (const { rideId, reqId } of landed) {
      const d = drives[rideId];
      drives[rideId] = { ...d, paid: { ...d.paid, [reqId]: { ...d.paid[reqId], status: "paid", at: now } } };
    }
    return { ...s, drives };
  });
  for (const { reqId } of landed) {
    const req = state.requests.find((q) => q.id === reqId);
    if (req) void systemAlert(`${personById(req.riderId)!.name.split(" ")[0]} paid ₹${req.amount} by UPI`, "Fuel share received.", "/earnings");
  }
}

/** Demo: what the other side might say about you after a trip. */
const SAID = {
  rider: { tags: [["On time", "Polite"], ["Easy pickup"], ["Paid quickly", "Good company"]], comments: ["", "Ready at the pickup, thanks!", ""] },
  driver: { tags: [["Safe driving", "On time"], ["Friendly", "Clean car"], ["Smooth route"]], comments: ["Great ride, thanks!", "", "Would ride again."] },
};

/** Queue a rating for you from `fromId`, arriving `inMs` from now. */
function queueRating(rideId: string, fromId: string, as: ReceivedRating["as"], inMs: number, i = 0) {
  const said = SAID[as];
  const rating: ReceivedRating = {
    id: `rr${Date.now().toString(36)}${i}`,
    rideId,
    fromId,
    as,
    stars: i % 3 === 2 ? 4 : 5,
    tags: said.tags[i % said.tags.length],
    comment: said.comments[i % said.comments.length],
    at: Date.now() + inMs,
  };
  set((s) => ({ ...s, received: [...s.received, rating] }));
}

/** Ratings that have arrived (their time has come); the rest are still on their way. */
export function receivedRatings(s: State, now = Date.now()): ReceivedRating[] {
  return s.received.filter((r) => r.at <= now);
}

// Ratings already announced with an alert, this session.
const announced = new Set<string>();

function deliverRatings() {
  const now = Date.now();
  for (const r of state.received) {
    if (!r.at || r.at > now || announced.has(r.id)) continue;
    announced.add(r.id);
    if (now - r.at > 5000) continue; // arrived while the app was closed
    void systemAlert(
      `${personById(r.fromId)!.name.split(" ")[0]} rated you ${"★".repeat(r.stars)}`,
      [r.tags.join(" · "), r.comment].filter(Boolean).join(" — ") || `As a ${r.as}`,
      "/profile#ratings",
    );
    // Re-render so the new rating shows up (it was hidden while its time was ahead).
    set((s) => ({ ...s, received: [...s.received] }));
  }
}

/** The riders on a ride you're driving: accepted seat requests, in pickup order. */
export function ridersOn(s: State, ride: Ride): RideRequest[] {
  return s.requests
    .filter((r) => r.rideId === ride.id && r.kind === "seat" && r.status === "accepted")
    .sort((a, b) => ride.stops.indexOf(a.segment.from) - ride.stops.indexOf(b.segment.from));
}

/** Passenger requests still waiting for your answer. */
export function pendingRequests(s: State) {
  return s.requests.filter((r) => r.status === "pending");
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    state = empty;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return state;
}

function getServerSnapshot() {
  return empty;
}

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const noop = () => () => {};

/** False during the server render and hydration, true once local data is readable. */
/** The signed-in person: the account from sign-up layered over the demo profile. */
export function useMe(): Person {
  const { account } = useStore();
  return account ? { ...me, name: account.name, role: account.role, dept: account.dept, photo: undefined } : me;
}

export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

function subscribeMinute(listener: () => void) {
  const timer = window.setInterval(listener, 30_000);
  return () => window.clearInterval(timer);
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** Minutes after midnight, refreshed every 30 s; null until hydrated. */
export function useNowMinutes(): number | null {
  return useSyncExternalStore(subscribeMinute, nowMinutes, () => null);
}

export function allRides(s: State): Ride[] {
  return [...seedRides, ...(s.today?.rides ?? []), ...s.offered].sort(compareRides);
}

export function findRide(s: State, id: string): Ride | undefined {
  return seedRides.find((r) => r.id === id) ?? s.today?.rides.find((r) => r.id === id) ?? s.offered.find((r) => r.id === id);
}

export function bookingFor(s: State, rideId: string): Booking | undefined {
  return s.bookings.find((b) => b.rideId === rideId);
}

export function seatsLeft(s: State, ride: Ride): number {
  return ride.seatsTotal - ride.seatsTaken - (bookingFor(s, ride.id)?.seats ?? 0);
}

export function isMine(ride: Ride) {
  return ride.driverId === ME_ID;
}

/** What riders owe you for the rides you're driving. */
export function earnings(s: State) {
  const rides = [...s.offered].sort(compareRides);
  // Settle-up requests you accepted are owed to you at the end of the month.
  const settleUp = s.requests.filter((r) => r.kind === "settle-up" && r.status === "accepted").reduce((sum, r) => sum + r.amount, 0);
  // Each booked rider pays an equal fuel share among the people now in the car.
  const booked = rides.reduce((sum, r) => sum + (r.seatsTaken ? r.seatsTaken * segmentFare(r, fullSegment(r), 0) : 0), 0) + settleUp;
  const ifFull = rides.reduce((sum, r) => sum + r.seatsTotal * r.fare, 0) + settleUp;
  // Fuel shares riders have actually paid you after finished trips.
  const earned = rides.reduce((sum, r) => {
    const d = s.drives[r.id];
    if (!d) return sum;
    return sum + ridersOn(s, r).filter((q) => d.paid[q.id]?.status === "paid").reduce((x, q) => x + q.amount, 0);
  }, 0);
  return { rides, booked, ifFull, settleUp, earned };
}

const AUTO_FARE_PER_KM = 18;
const CO2_KG_PER_KM = 0.14;

/** What sharing has saved compared with taking an auto alone. */
export function impact(s: State) {
  let km = 0;
  let paid = 0;
  for (const b of s.bookings) {
    const ride = findRide(s, b.rideId);
    if (!ride) continue;
    km += segmentKm(ride, b.segment) * b.seats;
    paid += b.fare * b.seats;
  }
  return {
    rides: s.bookings.length,
    km,
    co2Kg: km * CO2_KG_PER_KM,
    saved: Math.max(0, Math.round(km * AUTO_FARE_PER_KM - paid)),
  };
}

export const actions = {
  book(booking: Omit<Booking, "bookedAt">) {
    set((s) => ({
      ...s,
      bookings: [
        ...s.bookings.filter((b) => b.rideId !== booking.rideId),
        { ...booking, bookedAt: Date.now() },
      ],
    }));
    const ride = findRide(state, booking.rideId);
    const driver = ride && personById(ride.driverId);
    if (ride && driver) {
      const { depart } = segmentTimes(ride, booking.segment);
      void systemAlert(
        `${booking.seats > 1 ? `${booking.seats} seats` : "Seat"} booked with ${driver.name.split(" ")[0]}`,
        `${dayLabels[ride.day]}, ${formatClock(depart)} · ${placeById[booking.segment.from].name}`,
        `/rides/${ride.id}`,
      );
    }
  },
  /** One more seat on a ride you've already booked. */
  addSeat(rideId: string) {
    // One more person in the car: everyone's fuel share drops.
    set((s) => {
      const ride = findRide(s, rideId);
      return {
        ...s,
        bookings: s.bookings.map((b) =>
          b.rideId === rideId ? { ...b, seats: b.seats + 1, fare: ride ? segmentFare(ride, b.segment, b.seats + 1) : b.fare } : b,
        ),
      };
    });
  },
  /** Demo: run this booked trip from pickup to drop-off in a few seconds. */
  playTrip(rideId: string) {
    set((s) => ({ ...s, trips: { ...s.trips, [rideId]: { simStart: Date.now() } } }));
  },
  /** The ride has finished: record it once, and tell the rider. */
  completeTrip(rideId: string) {
    if (state.trips[rideId]?.completedAt) return;
    set((s) => ({ ...s, trips: { ...s.trips, [rideId]: { ...s.trips[rideId], completedAt: Date.now(), seen: false } } }));
    const ride = findRide(state, rideId);
    const booking = bookingFor(state, rideId);
    if (ride && booking) {
      // A little later, your driver rates you as a rider.
      queueRating(rideId, ride.driverId, "rider", 8000);
      const driver = personById(ride.driverId);
      void systemAlert(
        `You've reached ${placeById[booking.segment.to].name}`,
        `Ride with ${driver?.name.split(" ")[0] ?? "your driver"} complete. Pay ₹${booking.fare * booking.seats} and rate the ride.`,
        `/rides/${rideId}/complete`,
      );
    }
  },
  /** The rider has seen the "Ride complete" screen. */
  dismissComplete(rideId: string) {
    set((s) => ({ ...s, trips: { ...s.trips, [rideId]: { ...s.trips[rideId], seen: true } } }));
  },
  rate(rideId: string, rating: Omit<Rating, "at">) {
    set((s) => ({ ...s, ratings: { ...s.ratings, [rideId]: { ...rating, at: Date.now() } } }));
  },
  markNotificationsRead(ids: string[]) {
    set((s) => ({ ...s, notifRead: [...new Set([...s.notifRead, ...ids])] }));
  },
  setAlerts(on: boolean) {
    set((s) => ({ ...s, alerts: on }));
  },
  /** Ask the browser for permission, register the service worker, and switch ride alerts on. */
  async enableAlerts(): Promise<NotificationPermission | "unsupported"> {
    if (typeof Notification === "undefined") return "unsupported";
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permission === "granted") {
      try {
        await navigator.serviceWorker?.register("/sw.js");
        await navigator.serviceWorker?.ready;
      } catch {
        // No service worker (e.g. some desktop browsers in private mode): page notifications still work.
      }
      set((s) => ({ ...s, alerts: true }));
    }
    return permission;
  },
  /** A sample alert so the rider can see what ride alerts look like. */
  testAlert() {
    void systemAlert("Ride alerts are on", "You'll hear about bookings, messages and payments here.", "/notifications");
  },
  publish(ride: Omit<Ride, "id" | "driverId" | "seatsTaken">): string {
    const id = `m${Date.now().toString(36)}`;
    set((s) => ({ ...s, offered: [...s.offered, { ...ride, id, driverId: ME_ID, seatsTaken: 0 }] }));
    scheduleDemoRequests(id);
    return id;
  },
  /** Driver: call off a ride you offered. Everyone booked or waiting on it is told. */
  withdraw(rideId: string, reason: string) {
    const ride = state.offered.find((r) => r.id === rideId);
    if (!ride) return;
    // Riders with a seat (or a seat request) on this ride; settle-ups are for earlier trips.
    const told = [
      ...new Set(state.requests.filter((r) => r.rideId === rideId && r.kind === "seat" && r.status !== "declined").map((r) => r.riderId)),
    ];
    const { depart } = segmentTimes(ride, fullSegment(ride));
    const note: Cancellation = {
      id: `c${Date.now().toString(36)}`,
      side: "driver",
      rideId,
      driverId: ride.driverId,
      segment: fullSegment(ride),
      when: `${dayLabels[ride.day]}, ${formatClock(depart)}`,
      reason,
      told: told.map((id) => personById(id)!.name),
      at: Date.now(),
      seen: false,
    };
    set((s) => ({
      ...s,
      offered: s.offered.filter((r) => r.id !== rideId),
      requests: s.requests.filter((r) => r.rideId !== rideId || r.kind === "settle-up"),
      incoming: s.incoming.filter((r) => r.rideId !== rideId || r.kind === "settle-up"),
      cancellations: [...s.cancellations, note],
    }));
  },
  /**
   * Demo of the rider side: the driver calls off the ride you booked. The seat is released,
   * any wallet payment comes back, and you're told straight away.
   */
  driverCancels(rideId: string, reason: string) {
    const ride = findRide(state, rideId);
    const booking = bookingFor(state, rideId);
    if (!ride || !booking) return;
    const paid = state.payments[rideId];
    const refund = paid?.method === "wallet" ? paid.amount : undefined;
    const { depart } = segmentTimes(ride, booking.segment);
    const note: Cancellation = {
      id: `c${Date.now().toString(36)}`,
      side: "rider",
      rideId,
      driverId: ride.driverId,
      segment: booking.segment,
      when: `${dayLabels[ride.day]}, ${formatClock(depart)}`,
      reason,
      told: [],
      refund,
      at: Date.now(),
      seen: false,
    };
    set((s) => {
      const payments = { ...s.payments };
      const trips = { ...s.trips };
      delete payments[rideId];
      delete trips[rideId];
      return {
        ...s,
        bookings: s.bookings.filter((b) => b.rideId !== rideId),
        payments,
        trips,
        wallet: s.wallet + (refund ?? 0),
        cancellations: [...s.cancellations, note],
      };
    });
    const name = personById(ride.driverId)?.name.split(" ")[0] ?? "Your driver";
    void systemAlert(
      `${name} cancelled your ride`,
      `${placeById[booking.segment.from].name} → ${placeById[booking.segment.to].name}, ${note.when}. ${reason}. Find another ride in UniGo.`,
      "/find",
    );
  },
  /** The cancellation pop-up or toast has been seen. */
  dismissCancellation(id: string) {
    set((s) => ({ ...s, cancellations: s.cancellations.map((c) => (c.id === id ? { ...c, seen: true } : c)) }));
  },
  /** Driver: say yes to a passenger. A seat request takes the seats on your ride. */
  acceptRequest(requestId: string) {
    set((s) => {
      const req = s.requests.find((r) => r.id === requestId);
      if (!req || req.status !== "pending") return s;
      const ride = s.offered.find((r) => r.id === req.rideId);
      if (req.kind === "seat" && (!ride || ride.seatsTotal - ride.seatsTaken < req.seats)) return s;
      return {
        ...s,
        offered:
          req.kind === "seat"
            ? s.offered.map((r) => (r.id === req.rideId ? { ...r, seatsTaken: r.seatsTaken + req.seats } : r))
            : s.offered,
        requests: s.requests.map((r) => (r.id === requestId ? { ...r, status: "accepted", answeredAt: Date.now() } : r)),
      };
    });
  },
  /** Driver: set off. Riders are told you're on the way. */
  startDrive(rideId: string) {
    set((s) => ({ ...s, drives: { ...s.drives, [rideId]: { startedAt: Date.now(), boarded: {}, paid: {}, rated: {} } } }));
  },
  /** Driver: a rider got in, or didn't turn up at the pickup. */
  board(rideId: string, reqId: string, outcome: "picked" | "noshow") {
    set((s) => {
      const d = s.drives[rideId];
      return d ? { ...s, drives: { ...s.drives, [rideId]: { ...d, boarded: { ...d.boarded, [reqId]: outcome } } } } : s;
    });
  },
  /**
   * Driver: everyone's dropped off. Each rider who came pays their share. In this demo one pays by
   * UPI (lands in a few seconds), one hands over cash, one asks for monthly settle-up.
   */
  finishDrive(rideId: string) {
    const d = state.drives[rideId];
    const ride = state.offered.find((r) => r.id === rideId);
    if (!d || !ride) return;
    const methods: RiderPayment["method"][] = ["upi", "cash", "settle-up"];
    const picked = ridersOn(state, ride).filter((q) => d.boarded[q.id] === "picked");
    const paid = Object.fromEntries(
      picked.map((q, i) => {
        const method = methods[i % methods.length];
        return [q.id, { method, status: "pending" as const, dueAt: method === "upi" ? Date.now() + 3000 + i * 1500 : undefined }];
      }),
    );
    set((s) => ({ ...s, drives: { ...s.drives, [rideId]: { ...d, completedAt: Date.now(), paid } } }));
    // A little later, your riders rate you as a driver.
    picked.forEach((q, i) => queueRating(rideId, q.riderId, "driver", 6000 + i * 2500, i));
  },
  /** Driver: the rider handed over cash, or you accept their monthly settle-up. */
  settleRider(rideId: string, reqId: string) {
    set((s) => {
      const d = s.drives[rideId];
      if (!d?.paid[reqId]) return s;
      return { ...s, drives: { ...s.drives, [rideId]: { ...d, paid: { ...d.paid, [reqId]: { ...d.paid[reqId], status: "paid", at: Date.now() } } } } };
    });
  },
  rateRider(rideId: string, reqId: string, rating: Omit<Rating, "at">) {
    set((s) => {
      const d = s.drives[rideId];
      return d ? { ...s, drives: { ...s.drives, [rideId]: { ...d, rated: { ...d.rated, [reqId]: { ...rating, at: Date.now() } } } } } : s;
    });
  },
  /** Driver: say no. The passenger is told and can look for another ride. */
  declineRequest(requestId: string) {
    set((s) => ({
      ...s,
      requests: s.requests.map((r) =>
        r.id === requestId && r.status === "pending" ? { ...r, status: "declined", answeredAt: Date.now() } : r,
      ),
    }));
  },
  /** Step one of logging in or signing up: remember who is waiting for a code. */
  startVerification(pending: Pending) {
    set((s) => ({ ...s, pending }));
  },
  /** The emailed code checked out: open the session. Callers then navigate home and refresh. */
  completeVerification() {
    set((s) => {
      const p = s.pending;
      if (!p) return s;
      const account = p.flow === "signup" ? { name: p.name, email: p.email, role: p.role, dept: p.dept, idNumber: p.idNumber } : s.account;
      return { ...s, account, pending: null };
    });
    document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
  },
  /**
   * Pay a ride's fuel share. Wallet payments come off the balance. Cash and monthly settle-up
   * both wait for the driver: they confirm the cash, or accept the settle-up request.
   */
  pay(rideId: string, method: PayMethod, amount: number, upiId?: string) {
    const status: Payment["status"] = method === "cash" ? "pending" : method === "settle-up" ? "settle-requested" : "paid";
    set((s) => ({
      ...s,
      wallet: method === "wallet" ? s.wallet - amount : s.wallet,
      payments: { ...s.payments, [rideId]: { method, amount, at: Date.now(), status, upiId } },
    }));
    const ride = findRide(state, rideId);
    const name = (ride && personById(ride.driverId)?.name.split(" ")[0]) ?? "your driver";
    void systemAlert(
      status === "pending"
        ? `Hand ₹${amount} to ${name}`
        : status === "settle-requested"
          ? `Settle-up request sent to ${name}`
          : `Paid ₹${amount} to ${name}`,
      status === "settle-requested" ? "You'll hear back once they accept." : "Rate your ride while it's fresh.",
      `/rides/${rideId}/complete`,
    );
    // Demo: the driver answers a moment later — confirms the cash, or accepts the settle-up.
    if (status === "pending" || status === "settle-requested") {
      window.setTimeout(() => {
        const next: Payment["status"] = status === "pending" ? "paid" : "settle-up";
        set((s) =>
          s.payments[rideId]?.status === status ? { ...s, payments: { ...s.payments, [rideId]: { ...s.payments[rideId], status: next, answeredAt: Date.now() } } } : s,
        );
        void systemAlert(
          status === "pending" ? `${name} confirmed your ₹${amount} cash` : `${name} accepted your settle-up request`,
          status === "pending" ? "Payment complete." : `₹${amount} is on your monthly settle-up.`,
          `/rides/${rideId}`,
        );
      }, 3000);
    }
  },
  uploadDriverDoc(kind: "licence" | "rc", doc: DriverDoc) {
    set((s) => ({ ...s, driver: { ...s.driver, [kind]: doc, status: "none" } }));
  },
  /** Send both documents for review. In this demo the review always passes after a short wait. */
  submitDriverDocs() {
    set((s) => ({ ...s, driver: { ...s.driver, status: "checking" } }));
    window.setTimeout(() => {
      set((s) => (s.driver.status === "checking" ? { ...s, driver: { ...s.driver, status: "verified" } } : s));
      void systemAlert("You're a verified driver", "Your licence and RC are approved. You can offer rides now.", "/offer");
    }, REVIEW_MS);
  },
  logout() {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  },
  sendMessage(rideId: string, text: string) {
    set((s) => ({
      ...s,
      messages: { ...s.messages, [rideId]: [...(s.messages[rideId] ?? []), { from: "me", text, at: Date.now() }] },
    }));
  },
  setMode(mode: Mode) {
    set((s) => (s.mode === mode ? s : { ...s, mode }));
  },
  reset() {
    set(() => empty);
  },
};
