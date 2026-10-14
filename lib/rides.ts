import { me, people, type Day, type Person, type Ride } from "./data";
import { driveMinutes, legKm, placeById, routeKm, type PlaceId } from "./places";

const STOP_MINUTES = 2;

export const dayLabels: Record<Day, string> = { 0: "Today", 1: "Tomorrow", 2: "Day after" };

export function personById(id: string): Person | undefined {
  return id === me.id ? me : people.find((p) => p.id === id);
}

/** Where a rider gets on and off. Defaults to the full route. */
export type Segment = { from: PlaceId; to: PlaceId };

export function fullSegment(ride: Ride): Segment {
  return { from: ride.stops[0], to: ride.stops[ride.stops.length - 1] };
}

/** The segment if the ride passes `from` and later `to`, otherwise null. */
export function matchSegment(ride: Ride, from?: PlaceId, to?: PlaceId): Segment | null {
  const i = from ? ride.stops.indexOf(from) : 0;
  const j = to ? ride.stops.lastIndexOf(to) : ride.stops.length - 1;
  if (i < 0 || j < 0 || i >= j) return null;
  return { from: ride.stops[i], to: ride.stops[j] };
}

export function segmentStops(ride: Ride, seg: Segment): PlaceId[] {
  return ride.stops.slice(ride.stops.indexOf(seg.from), ride.stops.lastIndexOf(seg.to) + 1);
}

export function segmentKm(ride: Ride, seg: Segment): number {
  return routeKm(segmentStops(ride, seg));
}

/** Riders joining partway pay for the share of the route they use, in ₹5 steps. */
export function segmentFare(ride: Ride, seg: Segment): number {
  const total = routeKm(ride.stops);
  const part = segmentKm(ride, seg);
  if (part >= total - 0.1) return ride.fare;
  return Math.min(ride.fare, Math.max(20, Math.round((ride.fare * part) / total / 5) * 5));
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function formatClock(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m % 60).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

/** Arrival time at every stop, in minutes after midnight. */
export function timetable(ride: Ride): { place: PlaceId; at: number }[] {
  if (ride.times?.length === ride.stops.length) {
    return ride.stops.map((place, i) => ({ place, at: toMinutes(ride.times![i]) }));
  }
  let at = toMinutes(ride.time);
  return ride.stops.map((place, i) => {
    if (i > 0) at += driveMinutes(legKm(ride.stops[i - 1], place)) + STOP_MINUTES;
    return { place, at };
  });
}

export function segmentTimes(ride: Ride, seg: Segment) {
  const t = timetable(ride);
  return {
    depart: t.find((s) => s.place === seg.from)!.at,
    arrive: t.findLast((s) => s.place === seg.to)!.at,
  };
}

/** True once a ride left the rider's pickup more than a few minutes ago; it can no longer be booked. */
export function hasLeft(ride: Ride, seg: Segment, nowMin: number | null): boolean {
  return ride.day === 0 && nowMin !== null && segmentTimes(ride, seg).depart - nowMin < -5;
}

/**
 * Chip text for when a ride reaches the pickup: "Away 10 min" once the driver is close,
 * "In 20 min" within two hours, otherwise the clock time (or the day, for later days).
 */
export function leavesIn(ride: Ride, departMin: number, nowMin: number | null): string {
  if (ride.day !== 0) return dayLabels[ride.day];
  if (nowMin === null) return formatClock(departMin);
  const m = departMin - nowMin;
  if (m < -5) return `Left ${formatClock(departMin)}`;
  if (m <= 0) return "Leaving now";
  if (m <= 15) return `Away ${m} min`;
  if (m <= 120) return `In ${m} min`;
  return formatClock(departMin);
}

export function routeName(stops: PlaceId[]): string {
  return `${placeById[stops[0]].name} → ${placeById[stops[stops.length - 1]].name}`;
}

export function rupees(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function compareRides(a: Ride, b: Ride): number {
  return a.day - b.day || toMinutes(a.time) - toMinutes(b.time);
}
