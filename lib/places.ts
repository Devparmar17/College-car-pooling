// Pickup points around Indus University, west Ahmedabad.

const ROAD_FACTOR = 1.35;
const AVG_SPEED_KMH = 24;

export type PlaceId =
  | "indus"
  | "iskcon"
  | "ambli"
  | "shilaj"
  | "thaltej"
  | "bopal"
  | "southBopal"
  | "prahladnagar"
  | "vastrapur"
  | "shivranjani"
  | "sola"
  | "gota"
  | "nehrunagar";

export type Place = {
  id: PlaceId;
  name: string;
  area: string;
  lat: number;
  lng: number;
};

export const places: Place[] = [
  { id: "indus", name: "Indus University", area: "Rancharda, via Shilaj, Gujarat", lat: 23.062, lng: 72.451 },
  { id: "iskcon", name: "ISKCON Cross Road", area: "Satellite Road, Sarkhej–Gandhinagar Hwy", lat: 23.0258, lng: 72.5072 },
  { id: "ambli", name: "Ambali Road", area: "Ambli–Bopal Road", lat: 23.035, lng: 72.488 },
  { id: "shilaj", name: "Shilaj Circle", area: "Shilaj", lat: 23.059, lng: 72.48 },
  { id: "thaltej", name: "Thaltej Cross Road", area: "SG Highway", lat: 23.0505, lng: 72.5135 },
  { id: "bopal", name: "Bopal Circle", area: "Bopal", lat: 23.033, lng: 72.464 },
  { id: "southBopal", name: "South Bopal", area: "Bopal–Ghuma Road", lat: 23.017, lng: 72.47 },
  { id: "prahladnagar", name: "Prahlad Nagar Garden", area: "Prahlad Nagar", lat: 23.0115, lng: 72.508 },
  { id: "vastrapur", name: "Vastrapur Lake", area: "Vastrapur", lat: 23.0385, lng: 72.529 },
  { id: "shivranjani", name: "Shivranjani Cross Road", area: "Satellite", lat: 23.024, lng: 72.531 },
  { id: "sola", name: "Sola Cross Road", area: "Sola", lat: 23.0735, lng: 72.516 },
  { id: "gota", name: "Gota Cross Road", area: "Gota", lat: 23.101, lng: 72.542 },
  { id: "nehrunagar", name: "Nehru Nagar Circle", area: "Ambawadi", lat: 23.0225, lng: 72.547 },
];

export const placeById = Object.fromEntries(places.map((p) => [p.id, p])) as Record<
  PlaceId,
  Place
>;

export function isPlaceId(value: unknown): value is PlaceId {
  return typeof value === "string" && value in placeById;
}

/** Straight-line distance in km. */
function crowKm(a: PlaceId, b: PlaceId): number {
  const p = placeById[a];
  const q = placeById[b];
  const rad = Math.PI / 180;
  const dLat = (q.lat - p.lat) * rad;
  const dLng = (q.lng - p.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p.lat * rad) * Math.cos(q.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Road distance estimate between two points. */
export function legKm(a: PlaceId, b: PlaceId): number {
  return crowKm(a, b) * ROAD_FACTOR;
}

export function routeKm(stops: PlaceId[]): number {
  let km = 0;
  for (let i = 1; i < stops.length; i++) km += legKm(stops[i - 1], stops[i]);
  return km;
}

/** Pickup points a driver can take in with little detour, nearest to the start first. */
export function placesAlong(from: PlaceId, to: PlaceId): PlaceId[] {
  const direct = crowKm(from, to);
  return places
    .map((p) => p.id)
    .filter((id) => id !== from && id !== to && crowKm(from, id) + crowKm(id, to) <= direct * 1.1 + 0.3)
    .sort((a, b) => crowKm(from, a) - crowKm(from, b));
}

/** How close a route comes to a place, in straight-line km. */
export function nearestKm(stops: PlaceId[], place: PlaceId): number {
  return Math.min(...stops.map((s) => (s === place ? 0 : crowKm(s, place))));
}

export function driveMinutes(km: number): number {
  return Math.max(5, Math.round((km / AVG_SPEED_KMH) * 60));
}

/** Per-seat fare a driver is nudged towards: fuel split, rounded to ₹5. */
export function suggestedFare(km: number): number {
  return Math.max(20, Math.round((km * 3.5) / 5) * 5);
}
