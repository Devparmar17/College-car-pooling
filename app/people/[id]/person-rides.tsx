"use client";

import { allRides, bookingFor, seatsLeft, useStore } from "@/lib/store";
import { RequestCard } from "../../ui/request-card";
import styles from "./person.module.css";

export function PersonRides({ personId }: { personId: string }) {
  const s = useStore();
  const rides = allRides(s).filter((r) => r.driverId === personId);

  if (!rides.length) return <p className="muted">No rides posted right now.</p>;

  return (
    <div className={styles.list}>
      {rides.map((ride) => (
        <RequestCard
          key={ride.id}
          ride={ride}
          seatsLeft={seatsLeft(s, ride)}
          status={bookingFor(s, ride.id) ? "booked" : undefined}
        />
      ))}
    </div>
  );
}
