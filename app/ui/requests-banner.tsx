"use client";

import Link from "next/link";
import { personById } from "@/lib/rides";
import { pendingRequests, useHydrated, useStore } from "@/lib/store";
import { Avatar } from "./avatar";
import styles from "./requests-banner.module.css";

/** Driver side: "2 new ride requests" with the passengers' faces; opens Ride requests. */
export function RequestsBanner() {
  const s = useStore();
  const hydrated = useHydrated();
  const waiting = pendingRequests(s);
  if (!hydrated || !s.requests.length) return null;

  // Nothing new: a small link to the ones you've answered.
  if (!waiting.length) {
    return (
      <Link href="/requests" className={styles.answered}>
        Ride requests · {s.requests.length} answered →
      </Link>
    );
  }

  const riders = [...new Set(waiting.map((r) => r.riderId))].map((id) => personById(id)!);
  const first = riders[0].name.split(" ")[0];

  return (
    <Link href="/requests" className={styles.banner}>
      <span className={styles.faces} aria-hidden>
        {riders.slice(0, 3).map((p) => (
          <Avatar key={p.id} person={p} size={32} />
        ))}
      </span>
      <span className={styles.text}>
        <strong>
          {waiting.length} new ride request{waiting.length > 1 ? "s" : ""}
        </strong>
        <span>{riders.length > 1 ? `${first} and ${riders.length - 1} more are waiting` : `${first} is waiting for your answer`}</span>
      </span>
      <span className={styles.go}>Review →</span>
    </Link>
  );
}
