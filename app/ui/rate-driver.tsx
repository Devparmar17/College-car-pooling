"use client";

import { useState } from "react";
import type { Person } from "@/lib/data";
import { actions, useStore, type Rating } from "@/lib/store";
import { StarIcon } from "./icons";
import styles from "./rate-driver.module.css";

const WORDS = ["", "Poor", "Could be better", "Okay", "Good", "Great!"];

/** Quick tags: what riders say about drivers, and what drivers say about riders. */
const TAGS = {
  driver: {
    good: ["On time", "Safe driving", "Clean car", "Friendly", "Smooth route"],
    bad: ["Late", "Rash driving", "Unclean car", "Rude", "Changed the route"],
  },
  rider: {
    good: ["On time", "Polite", "Paid quickly", "Easy pickup", "Good company"],
    bad: ["Kept me waiting", "Late payment", "Rude", "Wrong pickup spot", "Messy"],
  },
};

/** Rider side: rate the driver after a trip. */
export function RateDriver({ rideId, driver }: { rideId: string; driver: Person }) {
  const saved = useStore().ratings[rideId];
  return (
    <RatePerson
      id={rideId}
      person={driver}
      about="driver"
      saved={saved}
      onSubmit={(rating) => actions.rate(rideId, rating)}
    />
  );
}

type Props = {
  id: string;
  person: Person;
  /** Who's being rated: the driver (by a rider) or a rider (by the driver). */
  about: "driver" | "rider";
  saved?: Rating;
  onSubmit: (rating: Omit<Rating, "at">) => void;
  compact?: boolean;
};

/** Rate someone after a trip: stars, quick tags, an optional comment. Used on both sides. */
export function RatePerson({ id, person, about, saved, onSubmit, compact }: Props) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const first = person.name.split(" ")[0];
  const size = compact ? 26 : 34;

  if (saved) {
    return (
      <section className={`${styles.card} ${styles.done} ${compact ? styles.compact : ""}`} aria-label="Your rating">
        <p className={styles.thanks}>Thanks for rating {first}!</p>
        <Stars value={saved.stars} small />
        {saved.tags.length > 0 && <p className={styles.savedTags}>{saved.tags.join(" · ")}</p>}
        {saved.comment && <p className={styles.savedComment}>“{saved.comment}”</p>}
      </section>
    );
  }

  const shown = hover || stars;
  const options = stars >= 4 ? TAGS[about].good : TAGS[about].bad;

  return (
    <section className={`${styles.card} ${compact ? styles.compact : ""}`} aria-labelledby={`rate-${id}`}>
      <h2 id={`rate-${id}`}>{about === "driver" ? `How was your ride with ${first}?` : `How was ${first} as a rider?`}</h2>
      <div className={styles.starRow} role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`${styles.star} ${n <= shown ? styles.lit : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => {
              // Switching between a good and a bad score clears tags that no longer fit.
              if ((n >= 4) !== (stars >= 4)) setTags([]);
              setStars(n);
            }}
          >
            <StarIcon size={size} />
          </button>
        ))}
      </div>
      <p className={styles.word} aria-live="polite">
        {shown ? WORDS[shown] : "Tap a star to rate"}
      </p>

      {stars > 0 && (
        <div className={styles.more}>
          <p className={styles.ask}>{stars >= 4 ? "What went well?" : "What went wrong?"}</p>
          <div className={styles.tags}>
            {options.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tags.includes(t)}
                className={styles.tag}
                onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            className={styles.comment}
            value={comment}
            maxLength={200}
            onChange={(e) => setComment(e.target.value)}
            placeholder={about === "driver" ? "Anything else about the ride? (optional)" : `Anything else about ${first}? (optional)`}
            aria-label="Comment"
          />
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => onSubmit({ stars, tags, comment: comment.trim() })}
          >
            Submit rating
          </button>
        </div>
      )}
    </section>
  );
}

function Stars({ value, small }: { value: number; small?: boolean }) {
  return (
    <span className={styles.starsStatic} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} size={small ? 20 : 34} className={n <= value ? styles.litIcon : styles.dimIcon} />
      ))}
    </span>
  );
}
