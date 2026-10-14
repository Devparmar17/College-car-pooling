"use client";

/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import Link from "next/link";
import { UNIVERSITY } from "@/lib/data";
import { useMe, useNowMinutes } from "@/lib/store";
import { Avatar } from "./ui/avatar";
import styles from "./greeting.module.css";

function greeting(mins: number | null) {
  if (mins === null || mins < 12 * 60) return "Good morning";
  if (mins < 17 * 60) return "Good afternoon";
  return "Good evening";
}

export function Greeting() {
  const now = useNowMinutes();
  const me = useMe();
  return (
    <header className={styles.header}>
      <Link href="/profile" aria-label="Your profile" className={styles.avatar}>
        <Avatar person={me} size={44} eager />
      </Link>
      <div className={styles.text}>
        <h1 className={styles.hello}>
          {greeting(now)}, {me.name.split(" ")[0]}
        </h1>
        <p className={styles.college}>
          <img src="/figma/verified-small.svg" alt="" width={13.8884} height={13.8875} />
          {UNIVERSITY} · {me.verified ? `Verified ${me.role.toLowerCase()}` : "Verification pending"}
        </p>
      </div>
      <span className={styles.bell} aria-hidden>
        <img src="/figma/bell.svg" alt="" width={44} height={44} />
      </span>
    </header>
  );
}
