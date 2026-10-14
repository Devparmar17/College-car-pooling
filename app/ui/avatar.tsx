import Image from "next/image";
import type { Person } from "@/lib/data";
import styles from "./avatar.module.css";

export function Avatar({ person, size = 40, eager }: { person: Person; size?: number; eager?: boolean }) {
  if (person.photo) {
    return (
      <Image
        className={styles.avatar}
        src={person.photo}
        alt=""
        width={size}
        height={size}
        sizes={`${size}px`}
        loading={eager ? "eager" : undefined}
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = person.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      className={`${styles.avatar} ${styles.initials}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
