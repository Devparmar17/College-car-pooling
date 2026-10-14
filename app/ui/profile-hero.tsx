/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import { personTitle, UNIVERSITY, type Person } from "@/lib/data";
import { placeById } from "@/lib/places";
import { Avatar } from "./avatar";
import { StarIcon } from "./icons";
import styles from "./profile-hero.module.css";

export function ProfileHero({ person }: { person: Person }) {
  return (
    <section className={styles.hero}>
      <Avatar person={person} size={96} eager />
      <h1 className={styles.name}>{person.name}</h1>
      <p className={styles.title}>
        {personTitle(person)} · {UNIVERSITY}
      </p>
      {person.verified ? (
        <span className={styles.verified}>
          <img src="/figma/verified-small.svg" alt="" width={13.8884} height={13.8875} />
          Verified {person.role === "Faculty" ? "faculty" : "student"}
        </span>
      ) : (
        <span className="chip">Verification pending</span>
      )}
      <dl className={styles.stats}>
        <div>
          <dt>Rating</dt>
          <dd className="tnum">
            <StarIcon size={15} className={styles.star} /> {person.rating.toFixed(1)}
          </dd>
        </div>
        <div>
          <dt>Rides shared</dt>
          <dd className="tnum">{person.ridesShared}</dd>
        </div>
        <div>
          <dt>Since</dt>
          <dd>{person.memberSince}</dd>
        </div>
      </dl>
      <dl className={styles.details}>
        <div>
          <dt>Lives near</dt>
          <dd>{placeById[person.home].name}</dd>
        </div>
        <div>
          <dt>Speaks</dt>
          <dd>{person.languages.join(", ")}</dd>
        </div>
      </dl>
      {person.bio && <p className={styles.bio}>{person.bio}</p>}
    </section>
  );
}
