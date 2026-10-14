import { placeById } from "./places";
import { dayLabels, formatClock, hasLeft, personById, rupees, segmentTimes } from "./rides";
import { findRide, type State } from "./store";

export type NoteKind = "booking" | "reminder" | "message" | "payment" | "rating" | "driver" | "match" | "welcome";

export type Note = {
  id: string;
  kind: NoteKind;
  title: string;
  body: string;
  href: string;
  /** Epoch ms, or 0 for things that happened before this device's history. */
  at: number;
};

const first = (driverId: string) => personById(driverId)?.name.split(" ")[0] ?? "your driver";

/** Everything worth telling the rider about, newest first. Built from app state, so it stays in step. */
export function buildNotifications(s: State, nowMin: number | null): Note[] {
  const notes: Note[] = [];

  for (const b of s.bookings) {
    const ride = findRide(s, b.rideId);
    if (!ride) continue;
    const name = first(ride.driverId);
    const { depart } = segmentTimes(ride, b.segment);
    const when = `${dayLabels[ride.day]}, ${formatClock(depart)}`;
    const pickup = placeById[b.segment.from].name;

    notes.push({
      id: `booked-${ride.id}-${b.seats}`,
      kind: "booking",
      title: `${b.seats > 1 ? `${b.seats} seats` : "Seat"} booked with ${name}`,
      body: `${when} · pickup at ${pickup}`,
      href: `/rides/${ride.id}`,
      at: b.bookedAt,
    });

    if (!s.payments[ride.id] && !hasLeft(ride, b.segment, nowMin)) {
      notes.push({
        id: `reminder-${ride.id}`,
        kind: "reminder",
        title: "Ride reminder",
        body: `${name} picks you up ${dayLabels[ride.day].toLowerCase()} at ${formatClock(depart)} from ${pickup}. Be there 2 minutes early.`,
        href: `/rides/${ride.id}`,
        at: b.bookedAt ? b.bookedAt + 1 : 0,
      });
    }

    (s.messages[ride.id] ?? []).forEach((m, i) => {
      if (m.from !== "driver") return;
      notes.push({
        id: `msg-${ride.id}-${i}`,
        kind: "message",
        title: `${name} sent you a message`,
        body: m.text,
        href: `/rides/${ride.id}/chat`,
        at: m.at,
      });
    });

    const p = s.payments[ride.id];
    if (p) {
      notes.push({
        id: `pay-${ride.id}-${p.status}`,
        kind: "payment",
        title:
          p.status === "pending"
            ? `Cash ${rupees(p.amount)} · waiting for ${name}`
            : p.status === "settle-up"
              ? `${rupees(p.amount)} added to monthly settle-up`
              : `Paid ${rupees(p.amount)} to ${name}`,
        body: `Fuel contribution for ${placeById[b.segment.from].name} → ${placeById[b.segment.to].name}`,
        href: `/rides/${ride.id}`,
        at: p.at,
      });
      if (!s.ratings[ride.id]) {
        notes.push({
          id: `rate-${ride.id}`,
          kind: "rating",
          title: `Rate your ride with ${name}`,
          body: "Two taps. It helps other riders pick good drivers.",
          href: `/rides/${ride.id}/complete`,
          at: p.at + 1,
        });
      }
    }
  }

  if (s.driver.status === "verified") {
    notes.push({ id: "driver-verified", kind: "driver", title: "You’re a verified driver", body: "Your licence and RC are approved. You can offer rides now.", href: "/offer", at: 0 });
  } else if (s.driver.status === "checking") {
    notes.push({ id: "driver-checking", kind: "driver", title: "Checking your documents", body: "We’ll let you know as soon as your licence and RC are approved.", href: "/profile#driver", at: Date.now() });
  } else {
    notes.push({ id: "driver-todo", kind: "driver", title: "Want to offer rides?", body: "Verify your driving licence and vehicle RC from your profile.", href: "/profile#driver", at: 0 });
  }

  notes.push(
    { id: "match-r110", kind: "match", title: "New ride on your route", body: "Mehul Joshi · Gota → Indus University, tomorrow at 7:40 AM", href: "/rides/r110", at: 0 },
    { id: "welcome", kind: "welcome", title: "Welcome to UniGo", body: "Find a ride to campus, or offer your own and share the fuel cost.", href: "/", at: 0 },
  );

  return notes.sort((a, b) => b.at - a.at);
}

/** "Just now", "12 min ago", "3:05 PM", "14 Oct", or "Earlier" for undated items. */
export function noteTime(at: number, now = Date.now()) {
  if (!at) return "Earlier";
  const mins = Math.floor((now - at) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const d = new Date(at);
  if (new Date(now).toDateString() === d.toDateString()) return formatClock(d.getHours() * 60 + d.getMinutes());
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
