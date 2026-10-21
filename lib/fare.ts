import type { Vehicle } from "./data";

/**
 * Nobody sets a price. A ride costs its fuel, and the riders (not the driver)
 * pays an equal share of it.
 */

/** Fuel cost per km: petrol at about ₹100/L, ~14 km/L for a car, ~40 km/L for a two-wheeler. */
export const FUEL_PER_KM: Record<Vehicle["kind"], number> = { car: 7, bike: 2.5 };

/** Fuel for a trip of `km`, in whole rupees. */
export function fuelCost(km: number, kind: Vehicle["kind"]): number {
  return Math.round(km * FUEL_PER_KM[kind]);
}

/** Prices are round numbers (₹35, ₹40, ₹50…): shares go up to the next ₹5, so the fuel is always covered. */
const ROUND_TO = 5;

/** One rider's equal share of `fuel` among `riders` (the driver doesn't pay), rounded up to ₹5. */
export function fuelShare(fuel: number, riders: number): number {
  return Math.max(ROUND_TO, Math.ceil(fuel / Math.max(1, riders) / ROUND_TO) * ROUND_TO);
}
