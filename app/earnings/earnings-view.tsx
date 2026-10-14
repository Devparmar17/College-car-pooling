"use client";

import Link from "next/link";
import { rupees } from "@/lib/rides";
import { earnings, pendingRequests, seatsLeft, useHydrated, useStore } from "@/lib/store";
import { RequestCard } from "../ui/request-card";
import { RequestsBanner } from "../ui/requests-banner";
import styles from "./earnings.module.css";

export function EarningsView() {
  const s = useStore();
  const hydrated = useHydrated();
  const { rides, booked, ifFull, settleUp } = earnings(s);

  return (
    <div className={`${styles.page} stagger`}>
      <section className={styles.summary}>
        <span className={styles.label}>Booked so far</span>
        <strong className={`${styles.amount} tnum`}>{hydrated ? rupees(booked) : "–"}</strong>
        <span className={styles.sub}>
          {hydrated && rides.length > 0
            ? `${rupees(ifFull)} if every seat on your ${rides.length} commute${rides.length === 1 ? "" : "s"} fills`
            : "Riders pay you by UPI after each ride"}
          {hydrated && settleUp > 0 && ` · incl. ${rupees(settleUp)} on monthly settle-up`}
        </span>
      </section>

      <RequestsBanner />
      {hydrated && s.requests.length > 0 && !pendingRequests(s).length && (
        <Link href="/requests" className={styles.allRequests}>
          Ride requests · {s.requests.length} answered →
        </Link>
      )}

      {hydrated && rides.length > 0 ? (
        <section className={styles.list}>
          <h2 className="section-title">Your commutes</h2>
          {rides.map((ride) => (
            <RequestCard key={ride.id} ride={ride} seatsLeft={seatsLeft(s, ride)} status="mine" />
          ))}
        </section>
      ) : (
        hydrated && (
          <div className={styles.empty}>
            <h3>No commutes offered yet</h3>
            <p>Offer your daily drive to campus and riders on the way can request a seat.</p>
            <Link href="/offer" className="btn btn-primary">
              Offer a ride
            </Link>
          </div>
        )
      )}
    </div>
  );
}
