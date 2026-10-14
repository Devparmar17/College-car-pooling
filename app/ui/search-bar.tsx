/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import Link from "next/link";
import styles from "./search-bar.module.css";

/** Figma "Frame 5": opens Find with the rider's search; "Later" searches tomorrow. */
export function SearchBar() {
  return (
    <div className={styles.bar}>
      <Link href="/find" className={styles.query}>
        <img src="/figma/search.svg" alt="" width={24} height={24} />
        <span>Where are you going?</span>
      </Link>
      <Link href="/find?day=1" className={styles.later}>
        <img src="/figma/clock.svg" alt="" width={16} height={16} />
        Later
      </Link>
    </div>
  );
}
