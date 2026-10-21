/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import Link from "next/link";
import type { Day } from "@/lib/data";
import styles from "./search-bar.module.css";

/** Figma "Frame 5": opens Find for the day picked on Home. */
export function SearchBar({ day = 0 }: { day?: Day }) {
  return (
    <div className={styles.bar}>
      <Link href={`/find?day=${day}`} className={styles.query}>
        <img src="/figma/search.svg" alt="" width={24} height={24} />
        <span>Where are you going?</span>
      </Link>
    </div>
  );
}
