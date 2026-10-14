import type { Vehicle } from "./data";

/**
 * Nobody sets a price. A ride costs its fuel, and everyone in the vehicle (driver included)
 * pays an equal share of it.
 */

/** Fuel cost per km: petrol at about ₹100/L, ~14 km/L for a car, ~40 km/L for a two-wheeler. */
export const FUEL_PER_KM: Record<Vehicle["kind"], number> = { car: 7, bike: 2.5 };

/** Fuel for a trip of `km`, in whole rupees. */
export function fuelCost(km: number, kind: Vehicle["kind"]): number {
  return Math.round(km * FUEL_PER_KM[kind]);
}

/** One person's equal share of `fuel` among `people` (driver included), rounded up to ₹1. */
export function fuelShare(fuel: number, people: number): number {
  return Math.max(1, Math.ceil(fuel / Math.max(1, people)));
}
