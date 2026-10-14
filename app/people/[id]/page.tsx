import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { people, reviews } from "@/lib/data";
import { StarIcon } from "../../ui/icons";
import { PageHeader } from "../../ui/page-header";
import { ProfileHero } from "../../ui/profile-hero";
import { PersonRides } from "./person-rides";
import styles from "./person.module.css";

type Params = PageProps<"/people/[id]">["params"];

export function generateStaticParams() {
  return people.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  return { title: people.find((p) => p.id === id)?.name ?? "Rider" };
}

export default function PersonPage({ params }: PageProps<"/people/[id]">) {
  return (
    <Suspense fallback={<PageHeader title="Profile" back="/find" />}>
      <Person params={params} />
    </Suspense>
  );
}

async function Person({ params }: { params: Params }) {
  const { id } = await params;
  const person = people.find((p) => p.id === id);
  if (!person) notFound();
  const theirReviews = reviews.filter((r) => r.personId === id);

  return (
    <>
      <PageHeader title={person.name} back="/find" />
      <div className={`${styles.page} stagger`}>
        <ProfileHero person={person} />

        <section>
          <h2 className="section-title">Upcoming rides</h2>
          <PersonRides personId={person.id} />
        </section>

        {theirReviews.length > 0 && (
          <section>
            <h2 className="section-title">What riders say</h2>
            <div className={styles.reviews}>
              {theirReviews.map((r) => (
                <figure key={r.by} className={`card ${styles.review}`}>
                  <div className={styles.stars} aria-label={`${r.rating} out of 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <StarIcon key={i} size={14} className={i < r.rating ? styles.on : styles.off} />
                    ))}
                  </div>
                  <blockquote>{r.text}</blockquote>
                  <figcaption className="muted">
                    {r.by} · {r.when}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
