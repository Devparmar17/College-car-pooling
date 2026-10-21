"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { actions, useHydrated, useMe, useStore } from "@/lib/store";
import { SHOW_ONBOARDING } from "../ui/onboarding";
import { ProfileHero } from "../ui/profile-hero";
import styles from "./profile.module.css";
import { PhoneCard } from "./phone-card";
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
      <PhoneCard />

      <VehicleCard />

      <button type="button" className="btn btn-block" onClick={() => window.dispatchEvent(new Event(SHOW_ONBOARDING))}>
        How UniGo works
      </button>

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

      {/* Demo data lives in this browser only; resetting it is a rare, quiet action. */}
      <button
        type="button"
        className={styles.reset}
        onClick={() => {
          if (!confirmReset) return setConfirmReset(true);
          actions.reset();
          setConfirmReset(false);
        }}
      >
        {confirmReset ? "Tap again to reset all demo data" : "Reset demo data"}
      </button>
    </>
  );
}
