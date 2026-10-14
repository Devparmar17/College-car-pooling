"use client";

import "leaflet/dist/leaflet.css";
import type { FitBoundsOptions, LatLngTuple, Map as LeafletMap } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { placeById, type PlaceId } from "@/lib/places";
import styles from "./ride-map.module.css";

// OpenStreetMap's own tiles: free with attribution, no key.
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Keep the pins clear of the Navigate button in the bottom-right corner.
// Side room for the pickup and drop-off labels; bottom room for the Navigate button.
const FIT: FitBoundsOptions = { paddingTopLeft: [110, 50], paddingBottomRight: [110, 76] };

const point = (id: PlaceId): LatLngTuple => [placeById[id].lat, placeById[id].lng];

/** Road geometry through every stop from the public OSRM server, or null when it can't be reached. */
async function roadRoute(stops: PlaceId[], signal: AbortSignal): Promise<LatLngTuple[] | null> {
  const coords = stops.map((id) => `${placeById[id].lng},${placeById[id].lat}`).join(";");
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const line: [number, number][] | undefined = data.routes?.[0]?.geometry?.coordinates;
    return line ? line.map(([lng, lat]) => [lat, lng]) : null;
  } catch {
    return null;
  }
}

/** Google Maps turn-by-turn: to the pickup for riders, or through every stop for the driver. */
export function navigationUrl(stops: PlaceId[], pickup: PlaceId, driving: boolean) {
  const ll = (id: PlaceId) => `${placeById[id].lat},${placeById[id].lng}`;
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  if (driving) {
    url.searchParams.set("origin", ll(stops[0]));
    url.searchParams.set("destination", ll(stops[stops.length - 1]));
    if (stops.length > 2) url.searchParams.set("waypoints", stops.slice(1, -1).map(ll).join("|"));
    url.searchParams.set("travelmode", "driving");
  } else {
    url.searchParams.set("destination", ll(pickup));
  }
  return url.toString();
}

type Props = {
  stops: PlaceId[];
  /** Where the rider gets on and off; highlighted pins. */
  pickup: PlaceId;
  dropoff: PlaceId;
  /** The signed-in person is driving this ride. */
  driving?: boolean;
};

/** Live street map of a ride: road route, stop pins and a Navigate button. */
export function RideMap({ stops, pickup, dropoff, driving }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const [roadDrawn, setRoadDrawn] = useState<boolean | null>(null);
  const key = stops.join(">");

  useEffect(() => {
    const abort = new AbortController();
    let map: LeafletMap | undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      if (abort.signal.aborted || !el.current) return;

      map = L.map(el.current, { zoomControl: false, scrollWheelZoom: false, attributionControl: true });
      L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
      map.attributionControl.setPrefix(false).setPosition("bottomleft");

      const pts = stops.map(point);
      map.fitBounds(L.latLngBounds(pts), FIT);

      // A straight dashed guide right away; swapped for the road route once it arrives.
      const guide = L.polyline(pts, { color: "#9a541c", weight: 3, dashArray: "4 8", opacity: 0.7 }).addTo(map);

      // Pickup and drop-off carry a permanent label; stops in between show their name on tap.
      // Labels face away from each other so they don't collide.
      const pickupLeft = placeById[pickup].lng < placeById[dropoff].lng;
      stops.forEach((id) => {
        const isPickup = id === pickup;
        const isDrop = id === dropoff;
        const kind = isPickup ? styles.pickup : isDrop ? styles.dropoff : styles.stop;
        const size = isPickup || isDrop ? 18 : 12;
        const marker = L.marker(point(id), {
          icon: L.divIcon({ className: kind, iconSize: [size, size] }),
          title: placeById[id].name,
          keyboard: false,
          zIndexOffset: isPickup || isDrop ? 1000 : 0,
        });
        if (isPickup || isDrop) {
          const toLeft = isPickup ? pickupLeft : !pickupLeft;
          marker.bindTooltip(
            `<b>${isPickup ? "Pickup" : "Drop-off"}</b>${placeById[id].name}`,
            {
              permanent: true,
              direction: toLeft ? "left" : "right",
              offset: [toLeft ? -10 : 10, 0],
              className: `${styles.tag} ${isPickup ? styles.tagPickup : styles.tagDrop}`,
            },
          );
        } else {
          marker.bindTooltip(placeById[id].name, { direction: "top", offset: [0, -8], className: styles.tooltip });
        }
        marker.addTo(map!);
      });

      const road = await roadRoute(stops, abort.signal);
      if (abort.signal.aborted || !map) return;
      if (road) {
        guide.remove();
        L.polyline(road, { color: "#ffffff", weight: 9, opacity: 0.9 }).addTo(map);
        L.polyline(road, { color: "#f8b477", weight: 5 }).addTo(map);
        map.fitBounds(L.latLngBounds(road), FIT);
      }
      setRoadDrawn(!!road);
    })();

    return () => {
      abort.abort();
      map?.remove();
    };
    // Rebuild only when the route itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pickup, dropoff]);

  return (
    <div className={styles.wrap}>
      <div ref={el} className={styles.map} role="img" aria-label={`Map of the route from ${placeById[stops[0]].name} to ${placeById[stops[stops.length - 1]].name}`} />
      <a
        href={navigationUrl(stops, pickup, !!driving)}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.navigate}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2 4.5 20.3l.7.7L12 18l6.8 3 .7-.7z" />
        </svg>
        {driving ? "Start navigation" : "Directions to pickup"}
      </a>
      <div className={styles.legend} aria-hidden>
        <span>
          <i className={styles.legendPickup} /> Pickup
        </span>
        <span>
          <i className={styles.legendDrop} /> Drop-off
        </span>
      </div>
      {roadDrawn === false && <span className={styles.note}>Showing straight lines · road route unavailable</span>}
    </div>
  );
}
