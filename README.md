# UniGo · College car pooling

A mobile-first carpooling app for Indus University students and faculty, built from the UniGo Figma file. Built with Next.js 16 (App Router, Cache Components).

```bash
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Screens

- **Home** (`/`): the Figma "Rider Home" screen (node 844:2747): Find/Offer Commute toggle, greeting, search, recent places, filter chips and the Requests row. Requests are today's rides into campus that haven't left yet, ranked by how close they pass your home; tomorrow's appear once today's have gone.
- **Find Commute** (`/find`): search by pickup, destination and day. A ride matches if it passes your pickup and later your drop-off, so you can join partway; the fare is prorated by distance.
- **Ride** (`/rides/[id]`): stop times, driver, vehicle, seat map, and booking or cancelling.
- **Offer Commute** (`/offer`): post a drive; pickups along the way and a fuel-split fare are suggested.
- **Earnings** (`/earnings`), **Menu** (`/menu`), **My trips** (`/trips`), **Profile** (`/profile`, `/people/[id]`).

Only Rider Home exists in Figma so far; the other screens reuse its components and tokens.

## Design system

- Colours, type and shapes come from the Figma styles and live as `--unigo-*` tokens in `app/globals.css`. Use only those tokens; don't add hex values in components.
- Font: Aptos (installed with Windows 11 / Microsoft 365). Devices without it fall back to Segoe UI / system UI. The recent-places card uses Roboto, as in the design.
- Icons in `public/figma/` were exported from the Figma file.

## Code

| Path | What it holds |
| --- | --- |
| `lib/places.ts` | Pickup points around Indus University with coordinates; distances, detour-based pickups, suggested fares. |
| `lib/data.ts` | Seed people, rides, reviews and recent places. The signed-in user is `me` (Dharam). |
| `lib/rides.ts` | Segment matching, prorated fares, timetables, "Away 10 min" chip text, departed-ride checks. |
| `lib/store.ts` | Client store for bookings and offered rides, saved in `localStorage` (no backend yet). |
| `app/ui/` | Figma components: `ModeToggle`, `BottomNav`, `RequestCard`, `RideFilters`, `SearchBar`, plus shared pieces. |

## Next steps

- Figma designs for the remaining screens
- Real accounts with university email sign-in, and a database for rides and bookings
- Seat requests that drivers approve, chat, live location on ride day
