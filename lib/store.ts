"use client";

import { useSyncExternalStore } from "react";
import { me, ME_ID, seedRides, type Person, type Ride } from "./data";
import { compareRides, segmentKm, type Segment } from "./rides";

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

/** A login or sign-up waiting for its emailed code. */
export type Pending =
  | { flow: "login"; email: string }
  | ({ flow: "signup" } & Account);

type State = {
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
  bookings: [{ rideId: "r109", seats: 1, segment: { from: "iskcon", to: "indus" }, fare: 40, bookedAt: 0 }],
  messages: {
    r109: [{ from: "driver", text: "Hi Dharam! I'll be at the ISKCON bus stop, Satellite side, by 8:13. White Creta.", at: 0 }],
  },
};

let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? { ...empty, ...JSON.parse(raw) } : demo;
    // Data saved before chat existed: give the demo booking its opening message.
    // A review that was still running when the tab closed has finished by now.
    if (state.driver.status === "checking") state = { ...state, driver: { ...state.driver, status: "verified" } };
    if (state.bookings.some((b) => b.rideId === "r109") && !state.messages.r109) {
      state = { ...state, messages: { ...state.messages, r109: demo.messages.r109 } };
    }
  } catch {
    // Private mode or corrupt data: start fresh.
  }
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
  return [...seedRides, ...s.offered].sort(compareRides);
}

export function findRide(s: State, id: string): Ride | undefined {
  return seedRides.find((r) => r.id === id) ?? s.offered.find((r) => r.id === id);
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
  const booked = rides.reduce((sum, r) => sum + r.seatsTaken * r.fare, 0);
  const ifFull = rides.reduce((sum, r) => sum + r.seatsTotal * r.fare, 0);
  return { rides, booked, ifFull };
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
  },
  publish(ride: Omit<Ride, "id" | "driverId" | "seatsTaken">): string {
    const id = `m${Date.now().toString(36)}`;
    set((s) => ({ ...s, offered: [...s.offered, { ...ride, id, driverId: ME_ID, seatsTaken: 0 }] }));
    return id;
  },
  withdraw(rideId: string) {
    set((s) => ({ ...s, offered: s.offered.filter((r) => r.id !== rideId) }));
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
  /** Close the session; callers then navigate to /login and refresh. */
  uploadDriverDoc(kind: "licence" | "rc", doc: DriverDoc) {
    set((s) => ({ ...s, driver: { ...s.driver, [kind]: doc, status: "none" } }));
  },
  /** Send both documents for review. In this demo the review always passes after a short wait. */
  submitDriverDocs() {
    set((s) => ({ ...s, driver: { ...s.driver, status: "checking" } }));
    window.setTimeout(() => {
      set((s) => (s.driver.status === "checking" ? { ...s, driver: { ...s.driver, status: "verified" } } : s));
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
