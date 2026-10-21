import { placeById } from "./places";
import { dayLabels, formatClock, hasLeft, personById, rupees, segmentTimes } from "./rides";
import { findRide, receivedRatings, type State } from "./store";

export type NoteKind = "booking" | "reminder" | "message" | "payment" | "rating" | "driver" | "match" | "welcome" | "request" | "cancel";

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

    const done = s.trips[ride.id]?.completedAt;
    if (done) {
      notes.push({
        id: `completed-${ride.id}`,
        kind: "booking",
        title: `Ride complete · you've reached ${placeById[b.segment.to].name}`,
        body: s.payments[ride.id] ? `Thanks for riding with ${name}.` : `Pay ${rupees(b.fare * b.seats)} to ${name} and rate the ride.`,
        href: s.payments[ride.id] ? `/rides/${ride.id}` : `/rides/${ride.id}/complete`,
        at: done,
      });
    }

    const p = s.payments[ride.id];
    if (p) {
      const trip = `${placeById[b.segment.from].name} → ${placeById[b.segment.to].name}`;
      const settle = p.method === "settle-up";
      // What you sent…
      notes.push({
        id: `pay-${ride.id}-${p.method}`,
        kind: "payment",
        title: settle
          ? `Settle-up request sent to ${name}`
          : p.method === "cash"
            ? `Cash ${rupees(p.amount)} · waiting for ${name}`
            : `Paid ${rupees(p.amount)} to ${name}`,
        body: settle ? `${rupees(p.amount)} for ${trip}. Waiting for ${name} to accept.` : `Fuel contribution for ${trip}`,
        href: `/rides/${ride.id}`,
        at: p.at,
      });
      // …and the driver's answer.
      if (p.status === "settle-up" || (p.method === "cash" && p.status === "paid")) {
        notes.push({
          id: `pay-${ride.id}-answered`,
          kind: "payment",
          title: settle ? `${name} accepted your settle-up request` : `${name} confirmed your cash`,
          body: settle ? `${rupees(p.amount)} is on your monthly settle-up.` : `${rupees(p.amount)} received. Payment complete.`,
          href: `/rides/${ride.id}`,
          at: p.answeredAt ?? p.at + 1,
        });
      }
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

  // Rides called off: by your driver (you booked), or by you (you were driving).
  for (const c of s.cancellations) {
    const route = `${placeById[c.segment.from].name} → ${placeById[c.segment.to].name}`;
    notes.push(
      c.side === "rider"
        ? {
            id: `cancel-${c.id}`,
            kind: "cancel",
            title: `${first(c.driverId)} cancelled your ride`,
            body: `${route}, ${c.when}. Reason: ${c.reason}.${c.refund ? ` ${rupees(c.refund)} refunded to Campus Wallet.` : ""}`,
            href: `/find?from=${c.segment.from}&to=${c.segment.to}`,
            at: c.at,
          }
        : {
            id: `cancel-${c.id}`,
            kind: "cancel",
            title: "You cancelled your ride",
            body: `${route}, ${c.when}.${c.told.length ? ` ${c.told.map((n) => n.split(" ")[0]).join(", ")} told.` : ""}`,
            href: "/earnings",
            at: c.at,
          },
    );
  }

  // Ratings others gave you, as a rider or as a driver.
  for (const r of receivedRatings(s)) {
    if (!r.at) continue;
    notes.push({
      id: `rated-${r.id}`,
      kind: "rating",
      title: `${first(r.fromId)} rated you ${"★".repeat(r.stars)}`,
      body: [`As a ${r.as}`, r.tags.join(", "), r.comment].filter(Boolean).join(" · "),
      href: "/profile#ratings",
      at: r.at,
    });
  }

  // Driver side: riders paying their fuel share after a trip you drove.
  for (const [rideId, d] of Object.entries(s.drives)) {
    for (const [reqId, pay] of Object.entries(d.paid)) {
      const req = s.requests.find((q) => q.id === reqId);
      if (!req || pay.status !== "paid") continue;
      const how = pay.method === "upi" ? "by UPI" : pay.method === "cash" ? "in cash" : "on monthly settle-up";
      notes.push({
        id: `ridepaid-${reqId}`,
        kind: "payment",
        title: `${first(req.riderId)} paid ${rupees(req.amount)} ${how}`,
        body: `Fuel share for ${placeById[req.segment.from].name} → ${placeById[req.segment.to].name}`,
        href: `/rides/${rideId}`,
        at: pay.at ?? d.completedAt ?? 0,
      });
    }
  }

  // Driver side: passengers asking you for a seat or a settle-up.
  for (const r of s.requests) {
    const rider = first(r.riderId);
    const trip = `${placeById[r.segment.from].name} → ${placeById[r.segment.to].name}`;
    notes.push({
      id: `request-${r.id}-${r.status}`,
      kind: "request",
      title:
        r.status === "pending"
          ? r.kind === "seat"
            ? `${rider} wants ${r.seats > 1 ? `${r.seats} seats` : "a seat"} on your ride`
            : `${rider} sent a settle-up request`
          : `You ${r.status} ${rider}'s ${r.kind === "seat" ? "seat" : "settle-up"} request`,
      body: r.kind === "seat" ? `${trip} · ${rupees(r.amount)}` : `${rupees(r.amount)} for ${r.trip ?? "an earlier ride"}`,
      href: "/requests",
      at: r.answeredAt ?? r.at,
    });
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
