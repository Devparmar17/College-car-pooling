import type { Ride } from "./data";
import { FUEL_PER_KM, fuelCost, fuelShare } from "./fare";
import { personById, segmentKm, segmentTimes, type Segment } from "./rides";

// Demo names for the other riders in the car; the app doesn't track who they are yet.
const CO_RIDERS = ["Aarav Shah", "Krish Mehta", "Neha Patel", "Riya Joshi", "Jay Trivedi"];

export type SplitMember = {
  name: string;
  initials: string;
  amount: number;
  role: "you" | "rider";
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/**
 * The trip's fuel cost (distance × fuel per km) shared equally by the riders; the driver
 * doesn't pay. Nobody picks the price.
 */
export function tripSplit(ride: Ride, seg: Segment, seats: number, myName: string) {
  const driver = personById(ride.driverId)!;
  const offset = ride.id.split("").reduce((n, c) => n + c.charCodeAt(0), 0);
  const others = Array.from({ length: ride.seatsTaken }, (_, i) => CO_RIDERS[(offset + i) % CO_RIDERS.length]);

  // Riders only: your seats plus the others booked.
  const people = seats + others.length;
  const km = segmentKm(ride, seg);
  const fuel = fuelCost(km, ride.vehicle.kind);
  const share = fuelShare(fuel, people);

  const members: SplitMember[] = [
    { name: "You", initials: initials(myName), amount: share * seats, role: "you" },
    ...others.map((n) => ({ name: n.split(" ")[0], initials: initials(n), amount: share, role: "rider" as const })),
  ];
  const { arrive } = segmentTimes(ride, seg);

  return {
    driver,
    members,
    people,
    km,
    fuelCost: fuel,
    perKm: FUEL_PER_KM[ride.vehicle.kind],
    share,
    youPay: share * seats,
    arrive,
  };
}

export const methodLabels = {
  wallet: "Campus Wallet",
  "upi-app": "UPI app",
  "upi-id": "UPI ID",
  cash: "Cash to driver",
  "settle-up": "Monthly settle-up",
} as const;
