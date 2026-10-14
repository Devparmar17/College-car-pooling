"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import styles from "./mode-toggle.module.css";

/** Figma "Component 8": switches between finding a commute (home) and offering one. */
export function ModeToggle({ active }: { active: "find" | "offer" }) {
  // The bottom bar records the mode after this renders, so on a switch this still holds the
  // previous one: slide the thumb over from that side.
  const previous = useStore().mode;
  const [switched] = useState(() => previous !== active);

  return (
    <div className={styles.wrap}>
      <nav className={styles.toggle} aria-label="Commute mode">
        <span
          className={`${styles.thumb} ${active === "offer" ? styles.right : ""} ${
            switched ? (active === "offer" ? styles.fromLeft : styles.fromRight) : ""
          }`}
          aria-hidden
        />
        <Link href="/" className={styles.option} aria-current={active === "find" ? "page" : undefined}>
          Find Commute
        </Link>
        <Link href="/offer" className={styles.option} aria-current={active === "offer" ? "page" : undefined}>
          Offer Commute
        </Link>
      </nav>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/toggle-underline.svg" alt="" width={155} height={1} className={styles.underline} />
    </div>
  );
}
