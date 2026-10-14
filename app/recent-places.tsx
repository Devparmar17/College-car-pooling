"use client";

/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import Link from "next/link";
import { useState } from "react";
import { recentPlaces } from "@/lib/data";
import { BackIcon } from "./ui/icons";
import styles from "./recent-places.module.css";

const VISIBLE = 2;

type Recent = (typeof recentPlaces)[number];

function Row({ r, hidden }: { r: Recent; hidden?: boolean }) {
  return (
    <li>
      <Link href={`/find?to=${r.place}`} className={styles.row} tabIndex={hidden ? -1 : undefined}>
        <span className={styles.icon}>
          <img src="/figma/history.svg" alt="" width={32} height={32} />
        </span>
        <span className={styles.text}>
          <span className={styles.title}>{r.title}</span>
          <span className={styles.subtitle}>{r.subtitle}</span>
        </span>
        <BackIcon size={18} className={styles.go} />
      </Link>
    </li>
  );
}

/** Figma "Component 4": recent destinations; the rest slide open on demand. */
export function RecentPlaces() {
  const [open, setOpen] = useState(false);
  const more = recentPlaces.slice(VISIBLE);

  return (
    <section className={styles.card} aria-label="Recent places">
      <ul className={styles.list}>
        {recentPlaces.slice(0, VISIBLE).map((r) => (
          <Row key={r.place} r={r} />
        ))}
      </ul>

      {more.length > 0 && (
        <>
          <div className={`${styles.more} ${open ? styles.moreOpen : ""}`} inert={!open}>
            <ul className={styles.list}>
              {more.map((r) => (
                <Row key={r.place} r={r} hidden={!open} />
              ))}
            </ul>
          </div>
          <button type="button" className={styles.toggle} onClick={() => setOpen(!open)} aria-expanded={open}>
            {open ? "Show less" : `Show ${more.length} more`}
            <img src="/figma/chevron-down.svg" alt="" width={30} height={30} className={styles.chevron} />
          </button>
        </>
      )}
    </section>
  );
}
