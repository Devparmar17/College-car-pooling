"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { placeById } from "@/lib/places";
import { dayLabels, formatClock, personById, segmentTimes } from "@/lib/rides";
import { actions, bookingFor, findRide, useHydrated, useStore } from "@/lib/store";
import { Avatar } from "../../../ui/avatar";
import { BackIcon, PhoneIcon, SendIcon } from "../../../ui/icons";
import styles from "./chat.module.css";

const quickReplies = ["I'm at the pickup", "Running 5 min late", "Where are you now?", "Thanks for the ride!"];

function timeOf(at: number) {
  if (!at) return "";
  const d = new Date(at);
  return formatClock(d.getHours() * 60 + d.getMinutes());
}

export function ChatView({ rideId }: { rideId: string }) {
  const s = useStore();
  const hydrated = useHydrated();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const ride = findRide(s, rideId);
  const booking = bookingFor(s, rideId);
  const messages = s.messages[rideId] ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (!hydrated) return <header className={styles.header} />;

  if (!ride || !booking) {
    return (
      <div className={styles.locked}>
        <h1>Chat opens after you book</h1>
        <p>Book a seat on this ride to call or message the driver.</p>
        <Link href={ride ? `/rides/${ride.id}` : "/find"} className="btn btn-primary">
          {ride ? "View ride" : "Find a ride"}
        </Link>
      </div>
    );
  }

  const driver = personById(ride.driverId)!;
  const { depart } = segmentTimes(ride, booking.segment);

  function send(e?: FormEvent, value = text) {
    e?.preventDefault();
    const msg = value.trim();
    if (!msg) return;
    actions.sendMessage(rideId, msg);
    setText("");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={`/rides/${ride.id}`} className={styles.back} aria-label="Back to ride">
          <BackIcon size={22} />
        </Link>
        <Avatar person={driver} size={40} />
        <div className={styles.who}>
          <strong>{driver.name}</strong>
          <span>
            {dayLabels[ride.day]} {formatClock(depart)} · {placeById[booking.segment.from].name}
          </span>
        </div>
        {driver.phone && (
          <a href={`tel:${driver.phone.replace(/\s/g, "")}`} className={styles.call} aria-label={`Call ${driver.name}`}>
            <PhoneIcon size={20} />
          </a>
        )}
      </header>

      <div className={styles.thread} aria-live="polite">
        <p className={styles.notice}>Demo chat · messages stay on this device</p>
        {messages.map((m, i) => (
          <div key={i} className={`${styles.bubble} ${m.from === "me" ? styles.mine : styles.theirs}`}>
            <span>{m.text}</span>
            {m.at > 0 && <time className="tnum">{timeOf(m.at)}</time>}
          </div>
        ))}
        {messages.length === 0 && <p className={styles.empty}>Say hi to {driver.name.split(" ")[0]} before the ride.</p>}
        <div ref={endRef} />
      </div>

      <div className={styles.composer}>
        <div className={styles.quick}>
          {quickReplies.map((q) => (
            <button key={q} type="button" onClick={() => send(undefined, q)}>
              {q}
            </button>
          ))}
        </div>
        <form className={styles.form} onSubmit={send}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${driver.name.split(" ")[0]}`}
            aria-label="Message"
            maxLength={300}
          />
          <button type="submit" disabled={!text.trim()} aria-label="Send">
            <SendIcon size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
