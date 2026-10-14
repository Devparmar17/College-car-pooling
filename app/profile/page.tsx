import type { Metadata } from "next";
import { historyStats, rideHistory } from "@/lib/history";
import { placeById } from "@/lib/places";
import { rupees } from "@/lib/rides";
import { Avatar } from "../ui/avatar";
import { PageHeader } from "../ui/page-header";
import { RideHistory } from "../ui/ride-history";
import { MyActivity, MyProfileHero, UpcomingCount } from "./my-activity";
import styles from "./profile.module.css";

export const metadata: Metadata = { title: "Profile" };


export default function ProfilePage() {
  const stats = historyStats(rideHistory);

  return (
    <>
      <PageHeader title="Profile" />
      <div className={`${styles.page} stagger`}>
        <MyProfileHero ridesShared={stats.total} />

        <section>
          <h2 className="section-title">Your rides</h2>
          <div className={styles.total}>
            <span className={styles.totalLabel}>Rides completed</span>
            <strong className="tnum">{stats.total}</strong>
            <span className={styles.totalSub}>
              {stats.asRider} as rider · {stats.asDriver} as driver
            </span>
          </div>
          <div className={styles.grid}>
            <Stat label="Upcoming" value={<UpcomingCount />} />
            <Stat label="Km shared" value={`${stats.km.toFixed(0)} km`} />
            <Stat label="CO₂ saved" value={`${stats.co2Kg.toFixed(1)} kg`} />
            <Stat label="Spent on rides" value={rupees(stats.spent)} />
            <Stat label="Earned driving" value={rupees(stats.earned)} accent />
            <Stat label="Saved vs. auto" value={rupees(stats.savedVsAuto)} accent />
          </div>
        </section>

        {(stats.topRoute || stats.topDriver) && (
          <section>
            <h2 className="section-title">Highlights</h2>
            <ul className={styles.highlights}>
              {stats.topRoute && (
                <li>
                  <span className={styles.hlIcon} aria-hidden>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/figma/pickup-dot.svg" alt="" width={13} height={13} />
                  </span>
                  <span>
                    <strong>
                      {placeById[stats.topRoute.from].name} → {placeById[stats.topRoute.to].name}
                    </strong>
                    <span>Your most travelled route · {stats.topRoute.count} rides</span>
                  </span>
                </li>
              )}
              {stats.topDriver && (
                <li>
                  <Avatar person={stats.topDriver.person} size={36} />
                  <span>
                    <strong>{stats.topDriver.person.name}</strong>
                    <span>You ride with them most · {stats.topDriver.count} rides</span>
                  </span>
                </li>
              )}
            </ul>
          </section>
        )}

        <section id="history" className={styles.anchor}>
          <h2 className="section-title">Ride history</h2>
          <RideHistory history={rideHistory} first={3} />
        </section>


        <MyActivity />
      </div>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`${styles.stat} ${accent ? styles.accent : ""}`}>
      <span>{label}</span>
      <strong className="tnum">{value}</strong>
    </div>
  );
}
