import { personById } from "./rides";
import { routeKm, type PlaceId } from "./places";

/** A finished ride: one Dharam rode in, or one Dharam drove. */
export type PastRide = {
  id: string;
  /** "YYYY-MM-DD" */
  date: string;
  time: string;
  from: PlaceId;
  to: PlaceId;
  /** Per-seat fare in rupees. */
  fare: number;
} & ({ role: "rider"; driverId: string; seats: number } | { role: "driver"; riders: number });

// Demo history, newest first.
export const rideHistory: PastRide[] = [
  { id: "h12", date: "2026-10-13", time: "08:15", from: "iskcon", to: "indus", fare: 40, role: "rider", driverId: "ketan", seats: 1 },
  { id: "h11", date: "2026-10-12", time: "17:30", from: "indus", to: "iskcon", fare: 40, role: "rider", driverId: "ketan", seats: 1 },
  { id: "h10", date: "2026-10-10", time: "08:00", from: "iskcon", to: "indus", fare: 50, role: "driver", riders: 2 },
  { id: "h09", date: "2026-10-09", time: "08:15", from: "ambli", to: "indus", fare: 40, role: "rider", driverId: "ketanp", seats: 1 },
  { id: "h08", date: "2026-10-08", time: "08:15", from: "iskcon", to: "indus", fare: 40, role: "rider", driverId: "ketan", seats: 1 },
  { id: "h07", date: "2026-10-07", time: "08:05", from: "thaltej", to: "indus", fare: 35, role: "rider", driverId: "mehul", seats: 1 },
  { id: "h06", date: "2026-10-06", time: "17:30", from: "indus", to: "iskcon", fare: 50, role: "driver", riders: 3 },
  { id: "h05", date: "2026-10-05", time: "08:15", from: "iskcon", to: "indus", fare: 40, role: "rider", driverId: "ketan", seats: 1 },
  { id: "h04", date: "2026-10-01", time: "08:40", from: "bopal", to: "indus", fare: 25, role: "rider", driverId: "aarav", seats: 1 },
  { id: "h03", date: "2026-09-30", time: "17:30", from: "indus", to: "iskcon", fare: 40, role: "rider", driverId: "ketan", seats: 1 },
  { id: "h02", date: "2026-09-29", time: "08:00", from: "iskcon", to: "indus", fare: 50, role: "driver", riders: 1 },
  { id: "h01", date: "2026-09-28", time: "17:15", from: "indus", to: "ambli", fare: 40, role: "rider", driverId: "ketanp", seats: 2 },
];

const AUTO_FARE_PER_KM = 18;
const CO2_KG_PER_KM = 0.14;

/** Totals and highlights across the ride history. */
export function historyStats(history: PastRide[]) {
  let km = 0;
  let spent = 0;
  let earned = 0;
  let asRider = 0;
  let asDriver = 0;
  const routes = new Map<string, number>();
  const drivers = new Map<string, number>();

  for (const r of history) {
    const d = routeKm([r.from, r.to]);
    const key = `${r.from}>${r.to}`;
    routes.set(key, (routes.get(key) ?? 0) + 1);
    if (r.role === "rider") {
      asRider++;
      km += d;
      spent += r.fare * r.seats;
      drivers.set(r.driverId, (drivers.get(r.driverId) ?? 0) + 1);
    } else {
      asDriver++;
      // Each rider is a car that stayed off the road for this trip.
      km += d * r.riders;
      earned += r.fare * r.riders;
    }
  }

  const top = <K,>(m: Map<K, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])[0];
  const [routeKey, routeCount] = top(routes) ?? [];
  const [driverId, driverCount] = top(drivers) ?? [];

  return {
    total: history.length,
    asRider,
    asDriver,
    km,
    co2Kg: km * CO2_KG_PER_KM,
    spent,
    earned,
    savedVsAuto: Math.max(0, Math.round(km * AUTO_FARE_PER_KM - spent)),
    topRoute: routeKey ? { from: routeKey.split(">")[0] as PlaceId, to: routeKey.split(">")[1] as PlaceId, count: routeCount! } : null,
    topDriver: driverId ? { person: personById(driverId)!, count: driverCount! } : null,
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d, weekday: DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] };
}

/** "Tue, 13 Oct" */
export function shortDate(date: string) {
  const { m, d, weekday } = parts(date);
  return `${weekday}, ${d} ${MONTHS[m - 1]}`;
}

/** "October 2026" */
export function monthLabel(date: string) {
  const { y, m } = parts(date);
  return `${MONTHS_LONG[m - 1]} ${y}`;
}
