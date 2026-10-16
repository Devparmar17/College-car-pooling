import { placeById, places, type PlaceId } from "./places";

/** Somewhere the rider typed: an area, society, landmark or their current location. */
export type Spot = { name: string; area: string; lat: number; lng: number };

/** A spot matched to the UniGo pickup point nearest to it. */
export type Match = Spot & { pickup: PlaceId; km: number; isPickup: boolean };

/** Well-known areas of west Ahmedabad, so common names work instantly and offline. */
const LOCALITIES: Spot[] = [
  { name: "Bodakdev", area: "Ahmedabad", lat: 23.0395, lng: 72.507 },
  { name: "Satellite", area: "Ahmedabad", lat: 23.03, lng: 72.518 },
  { name: "Science City", area: "Sola, Ahmedabad", lat: 23.079, lng: 72.495 },
  { name: "Sindhu Bhavan Road", area: "Bodakdev, Ahmedabad", lat: 23.041, lng: 72.499 },
  { name: "Ghuma", area: "Ahmedabad", lat: 23.028, lng: 72.457 },
  { name: "Shela", area: "Ahmedabad", lat: 23.005, lng: 72.46 },
  { name: "Sarkhej", area: "Ahmedabad", lat: 22.991, lng: 72.501 },
  { name: "Makarba", area: "Ahmedabad", lat: 23.0, lng: 72.508 },
  { name: "Vejalpur", area: "Ahmedabad", lat: 23.004, lng: 72.527 },
  { name: "Jodhpur Cross Road", area: "Satellite, Ahmedabad", lat: 23.023, lng: 72.525 },
  { name: "Anand Nagar", area: "Satellite, Ahmedabad", lat: 23.018, lng: 72.52 },
  { name: "Memnagar", area: "Ahmedabad", lat: 23.05, lng: 72.533 },
  { name: "Gurukul", area: "Memnagar, Ahmedabad", lat: 23.048, lng: 72.539 },
  { name: "Drive-In Road", area: "Ahmedabad", lat: 23.045, lng: 72.537 },
  { name: "Navrangpura", area: "Ahmedabad", lat: 23.037, lng: 72.56 },
  { name: "Gujarat University", area: "Navrangpura, Ahmedabad", lat: 23.036, lng: 72.547 },
  { name: "Ahmedabad University", area: "Navrangpura, Ahmedabad", lat: 23.039, lng: 72.552 },
  { name: "Ambawadi", area: "Ahmedabad", lat: 23.024, lng: 72.553 },
  { name: "Paldi", area: "Ahmedabad", lat: 23.01, lng: 72.56 },
  { name: "Ellisbridge", area: "Ahmedabad", lat: 23.023, lng: 72.564 },
  { name: "Naranpura", area: "Ahmedabad", lat: 23.056, lng: 72.553 },
  { name: "Ghatlodia", area: "Ahmedabad", lat: 23.064, lng: 72.54 },
  { name: "Chandlodia", area: "Ahmedabad", lat: 23.08, lng: 72.545 },
  { name: "Sola Bhagwat", area: "Sola, Ahmedabad", lat: 23.071, lng: 72.518 },
  { name: "Ognaj", area: "Ahmedabad", lat: 23.086, lng: 72.517 },
  { name: "Chharodi", area: "Ahmedabad", lat: 23.105, lng: 72.528 },
  { name: "Vaishno Devi Circle", area: "SG Highway, Ahmedabad", lat: 23.135, lng: 72.539 },
  { name: "Nirma University", area: "SG Highway, Ahmedabad", lat: 23.129, lng: 72.544 },
  { name: "Bhadaj", area: "Ahmedabad", lat: 23.088, lng: 72.488 },
  { name: "Hebatpur", area: "Thaltej, Ahmedabad", lat: 23.06, lng: 72.496 },
  { name: "Rancharda", area: "Ahmedabad", lat: 23.07, lng: 72.44 },
  { name: "Kalupur Railway Station", area: "Ahmedabad", lat: 23.026, lng: 72.601 },
  { name: "Ahmedabad Airport", area: "Hansol, Ahmedabad", lat: 23.073, lng: 72.626 },
  { name: "Maninagar", area: "Ahmedabad", lat: 22.996, lng: 72.603 },
  { name: "Kankaria Lake", area: "Maninagar, Ahmedabad", lat: 23.006, lng: 72.601 },
];

/** Straight-line distance in km. */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** The UniGo pickup point closest to a spot. */
export function nearestPickup(lat: number, lng: number): { pickup: PlaceId; km: number } {
  let best = places[0];
  let bestKm = Infinity;
  for (const p of places) {
    const km = distanceKm(lat, lng, p.lat, p.lng);
    if (km < bestKm) [best, bestKm] = [p, km];
  }
  return { pickup: best.id, km: bestKm };
}

export function toMatch(spot: Spot): Match {
  const { pickup, km } = nearestPickup(spot.lat, spot.lng);
  return { ...spot, pickup, km, isPickup: km < 0.05 };
}

/** The pickup points themselves, as matches. */
export const pickupMatches: Match[] = places.map((p) => ({ name: p.name, area: p.area, lat: p.lat, lng: p.lng, pickup: p.id, km: 0, isPickup: true }));

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Pickup points and known areas whose name matches what was typed. */
export function searchLocal(query: string): Match[] {
  const q = norm(query);
  if (!q) return pickupMatches;
  const score = (s: Spot) => {
    const n = norm(s.name);
    if (n.startsWith(q)) return 0;
    if (n.split(" ").some((w) => w.startsWith(q))) return 1;
    if (n.includes(q) || norm(s.area).includes(q)) return 2;
    return 9;
  };
  return [...pickupMatches, ...LOCALITIES.map(toMatch)]
    .map((m) => ({ m, s: score(m) }))
    .filter((x) => x.s < 9)
    .sort((a, b) => a.s - b.s || +b.m.isPickup - +a.m.isPickup)
    .map((x) => x.m);
}

// Greater Ahmedabad, so search results stay local.
const BBOX = "72.38,22.9,72.75,23.2";

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: { name?: string; street?: string; district?: string; locality?: string; city?: string; county?: string };
};

/** Any place in Ahmedabad, from OpenStreetMap (Photon search, made for search-as-you-type). */
export async function searchOnline(query: string, signal: AbortSignal): Promise<Match[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en&lat=23.04&lon=72.52&bbox=${BBOX}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data: { features: PhotonFeature[] } = await res.json();
  return data.features
    .filter((f) => f.properties.name)
    .map((f) => {
      const p = f.properties;
      const area = [p.street, p.locality ?? p.district, p.city ?? p.county].filter(Boolean).join(", ");
      return toMatch({ name: p.name!, area: area || "Ahmedabad", lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] });
    });
}

/** "1.2 km" / "400 m" */
export function formatKm(km: number): string {
  return km < 1 ? `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m` : `${km.toFixed(1)} km`;
}

export function pickupName(id: PlaceId): string {
  return placeById[id].name;
}
