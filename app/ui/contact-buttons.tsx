import Link from "next/link";
import type { Person } from "@/lib/data";
import { ChatIcon, PhoneIcon } from "./icons";
import styles from "./contact-buttons.module.css";

/** Call or chat with the driver of a ride you've booked. `labelled` shows the words next to the icons. */
export function ContactButtons({ driver, rideId, labelled }: { driver: Person; rideId: string; labelled?: boolean }) {
  const first = driver.name.split(" ")[0];
  return (
    <div className={`${styles.row} ${labelled ? styles.labelled : ""}`}>
      {driver.phone && (
        <a href={`tel:${driver.phone.replace(/\s/g, "")}`} className={styles.button} aria-label={`Call ${first}`}>
          <PhoneIcon size={18} />
          {labelled && <span>Call</span>}
        </a>
      )}
      <Link href={`/rides/${rideId}/chat`} className={`${styles.button} ${styles.chat}`} aria-label={`Chat with ${first}`}>
        <ChatIcon size={18} />
        {labelled && <span>Chat</span>}
      </Link>
    </div>
  );
}
