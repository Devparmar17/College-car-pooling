import type { Ride } from "./data";
import { segmentTimes, type Segment } from "./rides";

export type Stage = "booked" | "arriving" | "onboard" | "completed";

/** Per-ride trip state kept in the store. */
export type TripState = {
  /** Demo: when "Play this trip" was pressed; the trip then runs in a few seconds. */
  simStart?: number;
  /** When the ride was first seen as finished. */
  completedAt?: number;
  /** The rider has seen (or dismissed) the "Ride complete" screen. */
  seen?: boolean;
  /** You confirmed you're in the car (the driver sees it). */
  boardedAt?: number;
};

// Demo timings, in ms after "Play this trip".
const SIM_ARRIVING = 3000;
const SIM_ONBOARD = 9000;

/** The driver counts as "on the way" this long before pickup. */
const ARRIVING_MIN = 15;

/**
 * Where a booked ride is right now, from the clock (today's rides) or the demo playback.
 * `progress` runs 0 → 1 while you're on board.
 */
export function tripStage(ride: Ride, seg: Segment, trip: TripState | undefined, nowMs: number): { stage: Stage; progress: number } {
  if (trip?.completedAt) return { stage: "completed", progress: 1 };

  if (trip?.simStart) {
    const e = nowMs - trip.simStart;
    if (e < SIM_ARRIVING) return { stage: "arriving", progress: 0 };
    if (e < SIM_ONBOARD) return { stage: "onboard", progress: (e - SIM_ARRIVING) / (SIM_ONBOARD - SIM_ARRIVING) };
    return { stage: "completed", progress: 1 };
  }

  if (ride.day !== 0) return { stage: "booked", progress: 0 };
  const d = new Date(nowMs);
  const now = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  const { depart, arrive } = segmentTimes(ride, seg);
  if (now < depart - ARRIVING_MIN) return { stage: "booked", progress: 0 };
  if (now < depart) return { stage: "arriving", progress: 0 };
  if (now < arrive) return { stage: "onboard", progress: (now - depart) / (arrive - depart) };
  return { stage: "completed", progress: 1 };
}

/** Whether anything is moving fast enough to need a one-second clock. */
export function isPlaying(trip: TripState | undefined) {
  return !!trip?.simStart && !trip.completedAt;
}
