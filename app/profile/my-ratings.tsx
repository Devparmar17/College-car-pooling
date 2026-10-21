"use client";

import { personById } from "@/lib/rides";
import { receivedRatings, useHydrated, useStore, type ReceivedRating } from "@/lib/store";
import { Avatar } from "../ui/avatar";
import { StarIcon } from "../ui/icons";
import styles from "./my-ratings.module.css";

function average(list: ReceivedRating[]) {
  return list.length ? list.reduce((sum, r) => sum + r.stars, 0) / list.length : 0;
}

/** What others said about you: drivers rating you as a rider, riders rating you as a driver. */
export function MyRatings() {
  const s = useStore();
  const hydrated = useHydrated();
  if (!hydrated) return null;

  const all = receivedRatings(s).sort((a, b) => b.at - a.at);
  const asRider = all.filter((r) => r.as === "rider");
  const asDriver = all.filter((r) => r.as === "driver");

  return (
    <section id="ratings" className={styles.anchor}>
      <h2 className="section-title">Your ratings</h2>
      <div className={styles.tiles}>
        <Tile label="As a rider" list={asRider} />
        <Tile label="As a driver" list={asDriver} />
      </div>
      {all.length > 0 && (
        <ul className={styles.list}>
          {all.slice(0, 3).map((r) => {
            const from = personById(r.fromId)!;
            return (
              <li key={r.id}>
                <Avatar person={from} size={36} />
                <span className={styles.text}>
                  <span className={styles.top}>
                    <strong>{from.name}</strong>
                    <span className={styles.stars} aria-label={`${r.stars} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <StarIcon key={n} size={13} className={n <= r.stars ? styles.on : styles.off} />
                      ))}
                    </span>
                  </span>
                  <span>
                    Rated you as a {r.as}
                    {r.tags.length > 0 && ` · ${r.tags.join(", ")}`}
                  </span>
                  {r.comment && <q>{r.comment}</q>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Tile({ label, list }: { label: string; list: ReceivedRating[] }) {
  return (
    <div className={styles.tile}>
      <span className={styles.label}>{label}</span>
      {list.length ? (
        <>
          <strong className="tnum">
            <StarIcon size={18} className={styles.on} /> {average(list).toFixed(1)}
          </strong>
          <span className={styles.sub}>
            {list.length} rating{list.length === 1 ? "" : "s"}
          </span>
        </>
      ) : (
        <>
          <strong>New</strong>
          <span className={styles.sub}>No ratings yet</span>
        </>
      )}
    </div>
  );
}
