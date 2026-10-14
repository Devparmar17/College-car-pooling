/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import Link from "next/link";
import styles from "./auth.module.css";

/** Figma "Frame 33389": back circle, title, step line and two progress bars. */
export function AuthHeader({
  title,
  subtitle,
  back,
  steps,
}: {
  title: string;
  subtitle: string;
  back: string;
  /** How many of the two progress bars are filled; omit to hide them. */
  steps?: 1 | 2;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <Link href={back} className={styles.back} aria-label="Back">
          <img src="/figma/back-circle.svg" alt="" width={39} height={39} />
        </Link>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
      {steps && (
        <div className={styles.progress} aria-label={`Step ${steps} of 2`}>
          <span className={styles.done} />
          <span className={steps === 2 ? styles.done : undefined} />
        </div>
      )}
    </header>
  );
}
