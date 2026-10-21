import type { Metadata } from "next";
import { historyStats, rideHistory } from "@/lib/history";
import { rupees } from "@/lib/rides";
import { PageHeader } from "../ui/page-header";
import { RideHistory } from "../ui/ride-history";
import { MyActivity, MyProfileHero, UpcomingCount } from "./my-activity";
import { MyRatings } from "./my-ratings";
import styles from "./profile.module.css";

export const metadata: Metadata = { title: "Profile" };


export default function ProfilePage() {
  const stats = historyStats(rideHistory);

  return (
    <>
      <PageHeader title="Profile" />
      <div className={styles.page}>
        {/* Wide screens: your card and vehicle on the left, ride data on the right. Phones keep
            one column in the original order (see profile.module.css). */}
        <div className={`${styles.side} stagger`}>
          <MyProfileHero ridesShared={stats.total} />
          <MyActivity />
        </div>

        <div className={`${styles.main} stagger`}>
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
              <Stat label="Spent on rides" value={rupees(stats.spent)} />
              <Stat label="Earned driving" value={rupees(stats.earned)} accent />
            </div>
          </section>

          <MyRatings />

          <section id="history" className={styles.anchor}>
            <h2 className="section-title">Ride history</h2>
            <RideHistory history={rideHistory} first={3} />
          </section>
        </div>
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
