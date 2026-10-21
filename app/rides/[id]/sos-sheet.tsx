"use client";

import { useEffect, useRef, useState } from "react";
import type { Person, Ride } from "@/lib/data";
import sheet from "./confirm-sheet.module.css";
import styles from "./sos-sheet.module.css";

type Props = {
  ride: Ride;
  driver: Person;
  route: string;
  when: string;
  onClose: () => void;
};

/**
 * Emergency help during a ride: call 112 (India's emergency number), the women's helpline, or
 * send someone the trip details (driver, car, plate, route) so they know where you are.
 */
export function SosSheet({ ride, driver, route, when, onClose }: Props) {
  const callRef = useRef<HTMLAnchorElement>(null);
  const [shared, setShared] = useState<"" | "shared" | "copied">("");

  useEffect(() => {
    callRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const details = `UniGo ride: ${route}, ${when}. Driver ${driver.name}, ${ride.vehicle.color} ${ride.vehicle.model} ${ride.vehicle.plate}.`;

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "My UniGo ride", text: details });
        setShared("shared");
      } else {
        await navigator.clipboard.writeText(details);
        setShared("copied");
      }
    } catch {
      // Share sheet closed: nothing to do.
    }
  }

  return (
    <div className={sheet.backdrop} onClick={onClose}>
      <div className={sheet.sheet} role="alertdialog" aria-modal="true" aria-labelledby="sos-title" onClick={(e) => e.stopPropagation()}>
        <span className={sheet.grabber} aria-hidden />
        <h2 id="sos-title" className={styles.title}>
          <span className={styles.badge} aria-hidden>
            SOS
          </span>
          Emergency help
        </h2>
        <p className={styles.sub}>If you feel unsafe, get help right away. Calls go straight from your phone.</p>

        <a ref={callRef} href="tel:112" className={`${styles.option} ${styles.urgent}`}>
          <strong>Call 112</strong>
          <span>Police, ambulance and fire · all-India emergency</span>
        </a>
        <a href="tel:181" className={styles.option}>
          <strong>Call 181</strong>
          <span>Women&apos;s helpline</span>
        </a>
        <button type="button" className={styles.option} onClick={share}>
          <strong>{shared === "copied" ? "Trip details copied" : shared === "shared" ? "Trip details sent" : "Share trip details"}</strong>
          <span>
            {driver.name} · {ride.vehicle.model} · {ride.vehicle.plate}
          </span>
        </button>

        <button type="button" className="btn btn-block" onClick={onClose}>
          I&apos;m safe, close
        </button>
      </div>
    </div>
  );
}
