import { fuelCost, fuelShare } from "./fare";
import { routeKm, type PlaceId } from "./places";

export const UNIVERSITY = "Indus University";
export const UNIVERSITY_DOMAIN = "@indusuni.ac.in";

export type Pref = "women" | "ac" | "noSmoking" | "luggage" | "music" | "quiet";

export const prefLabels: Record<Pref, string> = {
  women: "Women pool",
  ac: "AC",
  noSmoking: "No smoking",
  luggage: "Luggage OK",
  music: "Music on",
  quiet: "Quiet ride",
};

export type Vehicle = {
  kind: "car" | "bike";
  model: string;
  color: string;
  plate: string;
};

export type Person = {
  id: string;
  name: string;
  photo?: string;
  /** Demo number for calling the driver. */
  phone?: string;
  role: "Faculty" | "Student" | "Staff";
  dept: string;
  home: PlaceId;
  rating: number;
  ridesShared: number;
  memberSince: string;
  verified: boolean;
  bio: string;
  languages: string[];
};

export function personTitle(p: Person) {
  return `${p.role} · ${p.dept} Dept`;
}

export type Day = 0 | 1 | 2;

export type Ride = {
  id: string;
  driverId: string;
  /** First stop is the start, last is the destination, the rest are pickups. */
  stops: PlaceId[];
  day: Day;
  /** 24h "HH:MM" departure from the first stop. */
  time: string;
  /** Scheduled time at every stop, when the driver set them. */
  times?: string[];
  /** Runs every weekday. */
  daily?: boolean;
  seatsTotal: number;
  seatsTaken: number;
  /** One person's fuel share for the whole route once every seat is filled, in rupees. */
  fare: number;
  vehicle: Vehicle;
  prefs: Pref[];
  note?: string;
};

export type Review = {
  personId: string;
  by: string;
  rating: number;
  text: string;
  when: string;
};

export const ME_ID = "me";

export const me: Person = {
  id: ME_ID,
  name: "Dharam",
  photo: "/img/ketan-2.jpg",
  role: "Student",
  dept: "CE",
  home: "iskcon",
  rating: 4.8,
  ridesShared: 12,
  memberSince: "Aug 2025",
  verified: true,
  bio: "",
  languages: ["Gujarati", "Hindi", "English"],
};

/** Places Dharam searched for recently, newest first. */
export const recentPlaces: { place: PlaceId; title: string; subtitle: string }[] = [
  { place: "indus", title: "Indus University", subtitle: "Rancharda, via Shilaj, Gujarat" },
  { place: "iskcon", title: "ISKCON Cross Road", subtitle: "Satellite Road, Sarkhej–Gandhinagar Hwy" },
  { place: "thaltej", title: "Thaltej Cross Road", subtitle: "SG Highway, Ahmedabad" },
  { place: "vastrapur", title: "Vastrapur Lake", subtitle: "Vastrapur, Ahmedabad" },
];

export const people: Person[] = [
  {
    id: "ketan",
    phone: "+91 90990 11201",
    name: "Ketan Mehta",
    photo: "/img/ketan.jpg",
    role: "Faculty",
    dept: "CE",
    home: "iskcon",
    rating: 4.9,
    ridesShared: 86,
    memberSince: "Jul 2025",
    verified: true,
    bio: "Teach Data Structures in the CE department. Drive in from ISKCON every weekday for the 9:30 lecture.",
    languages: ["Gujarati", "Hindi", "English"],
  },
  {
    id: "ketanp",
    phone: "+91 90990 11202",
    name: "Ketan Patel",
    role: "Faculty",
    dept: "IT",
    home: "ambli",
    rating: 4.8,
    ridesShared: 132,
    memberSince: "Jan 2025",
    verified: true,
    bio: "IT department. Happy to pick up anyone along Ambli Road on the way to campus.",
    languages: ["Gujarati", "English"],
  },
  {
    id: "riya",
    phone: "+91 90990 11203",
    name: "Riya Shah",
    photo: "/img/yashi.jpg",
    role: "Student",
    dept: "ME",
    home: "vastrapur",
    rating: 4.9,
    ridesShared: 57,
    memberSince: "Sep 2025",
    verified: true,
    bio: "Women pool only. I leave on time, so please be at the pickup a minute early.",
    languages: ["Gujarati", "Hindi"],
  },
  {
    id: "aarav",
    phone: "+91 90990 11204",
    name: "Aarav Desai",
    role: "Student",
    dept: "CE",
    home: "bopal",
    rating: 4.6,
    ridesShared: 23,
    memberSince: "Mar 2026",
    verified: true,
    bio: "Two-wheeler, one pillion seat. Spare helmet always in the dickey.",
    languages: ["Hindi", "English"],
  },
  {
    id: "mehul",
    phone: "+91 90990 11205",
    name: "Mehul Joshi",
    role: "Faculty",
    dept: "EC",
    home: "sola",
    rating: 4.7,
    ridesShared: 41,
    memberSince: "Feb 2026",
    verified: true,
    bio: "EC department. Big car, early start, quiet ride.",
    languages: ["Gujarati", "English"],
  },
];

const vehicles = {
  creta: { kind: "car", model: "Hyundai Creta", color: "White", plate: "GJ 01 KX 4821" },
  city: { kind: "car", model: "Honda City", color: "Grey", plate: "GJ 01 BP 0937" },
  swift: { kind: "car", model: "Maruti Swift", color: "Red", plate: "GJ 01 DM 6610" },
  innova: { kind: "car", model: "Toyota Innova", color: "Silver", plate: "GJ 01 AF 2205" },
  activa: { kind: "bike", model: "Honda Activa", color: "Blue", plate: "GJ 01 TS 7384" },
} satisfies Record<string, Vehicle>;

/** Nobody sets a price: each seat is an equal share of the route's fuel once every seat is taken. */
function seed(r: Omit<Ride, "fare">): Ride {
  return { ...r, fare: fuelShare(fuelCost(routeKm(r.stops), r.vehicle.kind), r.seatsTotal) };
}

export const seedRides: Ride[] = [
  seed({
    id: "r101",
    driverId: "ketan",
    stops: ["iskcon", "indus"],
    times: ["08:15", "09:15"],
    day: 0,
    time: "08:15",
    daily: true,
    seatsTotal: 3,
    seatsTaken: 1,
    vehicle: vehicles.creta,
    prefs: ["ac", "noSmoking"],
    note: "I wait at the ISKCON bus stop, Satellite side.",
  }),
  seed({
    id: "r102",
    driverId: "ketanp",
    stops: ["ambli", "indus"],
    times: ["08:15", "08:40"],
    day: 0,
    time: "08:15",
    seatsTotal: 3,
    seatsTaken: 1,
    vehicle: vehicles.city,
    prefs: ["ac", "music"],
  }),
  seed({
    id: "r103",
    driverId: "riya",
    stops: ["vastrapur", "thaltej", "indus"],
    times: ["08:30", "08:42", "09:05"],
    day: 0,
    time: "08:30",
    daily: true,
    seatsTotal: 3,
    seatsTaken: 1,
    vehicle: vehicles.swift,
    prefs: ["women", "ac"],
  }),
  seed({
    id: "r104",
    driverId: "aarav",
    stops: ["bopal", "indus"],
    times: ["08:40", "08:58"],
    day: 0,
    time: "08:40",
    seatsTotal: 1,
    seatsTaken: 0,
    vehicle: vehicles.activa,
    prefs: [],
    note: "Spare helmet provided.",
  }),
  seed({
    id: "r105",
    driverId: "mehul",
    stops: ["sola", "thaltej", "indus"],
    times: ["07:50", "08:05", "08:30"],
    day: 0,
    time: "07:50",
    daily: true,
    seatsTotal: 4,
    seatsTaken: 2,
    vehicle: vehicles.innova,
    prefs: ["quiet", "noSmoking"],
  }),
  seed({
    id: "r106",
    driverId: "ketan",
    stops: ["indus", "iskcon"],
    times: ["17:30", "18:20"],
    day: 0,
    time: "17:30",
    daily: true,
    seatsTotal: 3,
    seatsTaken: 0,
    vehicle: vehicles.creta,
    prefs: ["ac", "noSmoking"],
  }),
  seed({
    id: "r107",
    driverId: "riya",
    stops: ["indus", "thaltej", "vastrapur"],
    times: ["17:00", "17:25", "17:40"],
    day: 0,
    time: "17:00",
    daily: true,
    seatsTotal: 3,
    seatsTaken: 2,
    vehicle: vehicles.swift,
    prefs: ["women", "ac"],
  }),
  seed({
    id: "r108",
    driverId: "ketanp",
    stops: ["indus", "ambli"],
    times: ["17:15", "17:40"],
    day: 0,
    time: "17:15",
    seatsTotal: 3,
    seatsTaken: 1,
    vehicle: vehicles.city,
    prefs: ["ac", "music"],
  }),
  seed({
    id: "r109",
    driverId: "ketan",
    stops: ["iskcon", "indus"],
    times: ["08:15", "09:15"],
    day: 1,
    time: "08:15",
    daily: true,
    seatsTotal: 3,
    seatsTaken: 0,
    vehicle: vehicles.creta,
    prefs: ["ac", "noSmoking"],
  }),
  seed({
    id: "r110",
    driverId: "mehul",
    stops: ["gota", "sola", "indus"],
    times: ["07:40", "07:55", "08:30"],
    day: 1,
    time: "07:40",
    daily: true,
    seatsTotal: 4,
    seatsTaken: 1,
    vehicle: vehicles.innova,
    prefs: ["quiet", "noSmoking"],
  }),
  seed({
    id: "r111",
    driverId: "aarav",
    stops: ["southBopal", "bopal", "indus"],
    times: ["08:30", "08:38", "08:58"],
    day: 1,
    time: "08:30",
    seatsTotal: 1,
    seatsTaken: 0,
    vehicle: vehicles.activa,
    prefs: [],
  }),
  // Evening rides home from campus, tomorrow and the day after.
  seed({
    id: "r112",
    driverId: "ketan",
    stops: ["indus", "iskcon"],
    day: 1,
    time: "17:30",
    daily: true,
    seatsTotal: 3,
    seatsTaken: 1,
    vehicle: vehicles.creta,
    prefs: ["ac", "noSmoking"],
  }),
  seed({
    id: "r113",
    driverId: "riya",
    stops: ["indus", "thaltej", "vastrapur"],
    day: 1,
    time: "17:00",
    seatsTotal: 3,
    seatsTaken: 0,
    vehicle: vehicles.swift,
    prefs: ["women", "ac"],
  }),
  seed({
    id: "r125",
    driverId: "ketanp",
    stops: ["indus", "ambli"],
    day: 2,
    time: "17:15",
    seatsTotal: 3,
    seatsTaken: 1,
    vehicle: vehicles.city,
    prefs: ["ac", "music"],
  }),
  seed({
    id: "r126",
    driverId: "mehul",
    stops: ["indus", "sola", "gota"],
    day: 2,
    time: "17:10",
    seatsTotal: 4,
    seatsTaken: 2,
    vehicle: vehicles.innova,
    prefs: ["quiet", "noSmoking"],
  }),
  // Day after: a full morning of rides to campus.
  seed({
    id: "r120",
    driverId: "mehul",
    stops: ["gota", "sola", "indus"],
    day: 2,
    time: "07:40",
    daily: true,
    seatsTotal: 4,
    seatsTaken: 1,
    vehicle: vehicles.innova,
    prefs: ["quiet", "noSmoking"],
  }),
  seed({
    id: "r121",
    driverId: "ketan",
    stops: ["iskcon", "indus"],
    day: 2,
    time: "08:15",
    daily: true,
    seatsTotal: 3,
    seatsTaken: 0,
    vehicle: vehicles.creta,
    prefs: ["ac", "noSmoking"],
    note: "I wait at the ISKCON bus stop, Satellite side.",
  }),
  seed({
    id: "r122",
    driverId: "ketanp",
    stops: ["ambli", "indus"],
    day: 2,
    time: "08:20",
    seatsTotal: 3,
    seatsTaken: 2,
    vehicle: vehicles.city,
    prefs: ["ac", "music"],
  }),
  seed({
    id: "r123",
    driverId: "riya",
    stops: ["vastrapur", "thaltej", "indus"],
    day: 2,
    time: "08:30",
    seatsTotal: 3,
    seatsTaken: 1,
    vehicle: vehicles.swift,
    prefs: ["women", "ac"],
  }),
  seed({
    id: "r124",
    driverId: "aarav",
    stops: ["southBopal", "bopal", "indus"],
    day: 2,
    time: "08:35",
    seatsTotal: 1,
    seatsTaken: 0,
    vehicle: vehicles.activa,
    prefs: [],
  }),
];

/**
 * Demo: today's rides to campus, timed from when the app is opened (about 20 min, 45 min,
 * 1¼ h… from now), so there are always rides you can still book today.
 */
const TODAY_TEMPLATES: (Omit<Ride, "fare" | "id" | "day" | "time"> & { inMin: number })[] = [
  { inMin: 20, driverId: "ketan", stops: ["iskcon", "indus"], seatsTotal: 3, seatsTaken: 1, vehicle: vehicles.creta, prefs: ["ac", "noSmoking"] },
  { inMin: 45, driverId: "riya", stops: ["vastrapur", "thaltej", "indus"], seatsTotal: 3, seatsTaken: 1, vehicle: vehicles.swift, prefs: ["women", "ac"] },
  { inMin: 75, driverId: "aarav", stops: ["bopal", "indus"], seatsTotal: 1, seatsTaken: 0, vehicle: vehicles.activa, prefs: [] },
  { inMin: 105, driverId: "mehul", stops: ["sola", "thaltej", "indus"], seatsTotal: 4, seatsTaken: 2, vehicle: vehicles.innova, prefs: ["quiet", "noSmoking"] },
  { inMin: 150, driverId: "ketanp", stops: ["ambli", "shilaj", "indus"], seatsTotal: 3, seatsTaken: 0, vehicle: vehicles.city, prefs: ["ac", "music"] },
];

const LAST_DEPARTURE = 23 * 60 + 30;

/** Today's demo rides for a day key ("2026-10-21") and the minutes after midnight they start from. */
export function todaysDemoRides(dateKey: string, fromMin: number): Ride[] {
  return TODAY_TEMPLATES.map(({ inMin, ...r }, i) => ({ ...r, i, at: Math.ceil((fromMin + inMin) / 5) * 5 }))
    .filter(({ at }) => at <= LAST_DEPARTURE)
    .map(({ i, at, ...r }) =>
      seed({
        ...r,
        id: `t${dateKey.replaceAll("-", "")}${i}`,
        day: 0,
        time: `${String(Math.floor(at / 60)).padStart(2, "0")}:${String(at % 60).padStart(2, "0")}`,
      }),
    );
}

export const reviews: Review[] = [
  { personId: "ketan", by: "Riya M.", rating: 5, text: "Always on time for the 9:30 lecture, and the AC actually works.", when: "Sep 2026" },
  { personId: "ketan", by: "Harsh P.", rating: 5, text: "Got a quick doubt session on the way to campus.", when: "Oct 2026" },
  { personId: "ketanp", by: "Aman K.", rating: 4, text: "Good ride, ran about five minutes late at Ambli.", when: "Sep 2026" },
  { personId: "riya", by: "Khushi V.", rating: 5, text: "Felt safe, smooth driver. Will book again.", when: "Sep 2026" },
  { personId: "aarav", by: "Jay T.", rating: 5, text: "Cheapest ride to campus and never late.", when: "Oct 2026" },
  { personId: "mehul", by: "Neel D.", rating: 5, text: "Quiet, comfortable, and he waited when I was a minute late.", when: "Oct 2026" },
];

export const myVehicle: Vehicle = {
  kind: "car",
  model: "Maruti Baleno",
  color: "Red",
  plate: "GJ 01 RT 5512",
};
