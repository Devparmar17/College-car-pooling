import Link from "next/link";
import type { ReactNode } from "react";
import { BackIcon } from "./icons";
import styles from "./page-header.module.css";

export function PageHeader({
  title,
  back,
  action,
}: {
  title: ReactNode;
  back?: string;
  action?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      {back && (
        <Link href={back} className={styles.back} aria-label="Back">
          <BackIcon size={22} />
        </Link>
      )}
      <h1 className={styles.title}>{title}</h1>
      {action}
    </header>
  );
}
