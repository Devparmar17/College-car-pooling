"use client";

import Link from "next/link";
import { pendingRequests, useHydrated, useStore } from "@/lib/store";
import { PageHeader } from "../ui/page-header";
import { PassengerRequest } from "../ui/passenger-request";
import styles from "./requests.module.css";

/** Driver side: passengers asking for a seat or a monthly settle-up. */
export function RequestsView() {
  const s = useStore();
  const hydrated = useHydrated();
  const waiting = [...pendingRequests(s)].reverse();
  const answered = s.requests.filter((r) => r.status !== "pending").sort((a, b) => (b.answeredAt ?? 0) - (a.answeredAt ?? 0));

  return (
    <div className={styles.page}>
      <PageHeader title="Ride requests" back="/offer" />
      {hydrated && (
        <div className={`${styles.body} stagger`}>
          <p className="muted">Passengers on your route ask here. Accept to give them the seat, or decline if it doesn&apos;t suit you.</p>

          <section className={styles.group}>
            <h2 className="section-title">
              New {waiting.length > 0 && <span className={styles.count}>{waiting.length}</span>}
            </h2>
            {waiting.length ? (
              waiting.map((r) => <PassengerRequest key={r.id} request={r} />)
            ) : (
              <div className={styles.empty}>
                <strong>No new requests</strong>
                <span>
                  {s.offered.length
                    ? "We'll alert you as soon as a passenger asks for a seat."
                    : "Offer a ride and passengers on your route can request a seat."}
                </span>
                {!s.offered.length && (
                  <Link href="/offer" className="btn btn-primary">
                    Offer a ride
                  </Link>
                )}
              </div>
            )}
          </section>

          {answered.length > 0 && (
            <section className={styles.group}>
              <h2 className="section-title">Answered</h2>
              {answered.map((r) => (
                <PassengerRequest key={r.id} request={r} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
