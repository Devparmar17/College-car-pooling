"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { actions, useHydrated, useMe, useStore } from "@/lib/store";
import { ProfileHero } from "../ui/profile-hero";
import styles from "./profile.module.css";
import { VehicleCard } from "./vehicle-card";

/** Seats you hold on rides that haven't happened yet. */
export function UpcomingCount() {
  const s = useStore();
  const hydrated = useHydrated();
  return <>{hydrated ? s.bookings.length : "–"}</>;
}

/** Your card: the signed-up account, or the demo profile. */
export function MyProfileHero({ ridesShared }: { ridesShared: number }) {
  return <ProfileHero person={{ ...useMe(), ridesShared }} />;
}

export function MyActivity() {
  const router = useRouter();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <VehicleCard />

      <button
        type="button"
        className={`btn btn-block ${styles.logout}`}
        onClick={() => {
          actions.logout();
          router.replace("/login");
          router.refresh();
        }}
      >
        Log out
      </button>

      <section className={styles.reset}>
        <div>
          <strong>Demo data</strong>
          <p className="muted">Bookings and offered rides are stored in this browser only.</p>
        </div>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (!confirmReset) return setConfirmReset(true);
            actions.reset();
            setConfirmReset(false);
          }}
        >
          {confirmReset ? "Tap again to clear" : "Clear"}
        </button>
      </section>
    </>
  );
}
