"use client";

import Link from "next/link";
import { useSyncExternalStore, useState, type ComponentType } from "react";
import { buildNotifications, noteTime, type NoteKind } from "@/lib/notifications";
import { actions, useHydrated, useNowMinutes, useStore } from "@/lib/store";
import { CarIcon, ChatIcon, CheckIcon, ClockIcon, CloseIcon, RupeeIcon, SeatIcon, ShieldIcon, StarIcon } from "../ui/icons";
import { PageHeader } from "../ui/page-header";
import styles from "./notifications.module.css";

const ICONS: Record<NoteKind, ComponentType<{ size?: number }>> = {
  booking: CheckIcon,
  reminder: ClockIcon,
  message: ChatIcon,
  payment: RupeeIcon,
  rating: StarIcon,
  driver: ShieldIcon,
  match: CarIcon,
  welcome: CarIcon,
  request: SeatIcon,
  cancel: CloseIcon,
};

type Permission = NotificationPermission | "unsupported";

const noop = () => () => {};
const readPermission = (): Permission => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);

export function NotificationsView() {
  const s = useStore();
  const hydrated = useHydrated();
  const now = useNowMinutes();
  // Browser permission can only be read on the client; re-read after asking.
  const browserPermission = useSyncExternalStore(noop, readPermission, () => "default" as Permission);
  const [asked, setAsked] = useState<Permission | null>(null);
  const permission = asked ?? browserPermission;

  const notes = hydrated ? buildNotifications(s, now) : [];
  const unread = notes.filter((n) => !s.notifRead.includes(n.id));

  async function turnOn() {
    const result = await actions.enableAlerts();
    setAsked(result);
    if (result === "granted") actions.testAlert();
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        back="/"
        action={
          unread.length > 0 ? (
            <button type="button" className={styles.markAll} onClick={() => actions.markNotificationsRead(notes.map((n) => n.id))}>
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className={`${styles.page} stagger`}>
        <section className={styles.alerts}>
          <div>
            <strong>Ride alerts on this device</strong>
            <span>
              {permission === "unsupported"
                ? "This browser can’t show alerts. You’ll still see everything here."
                : permission === "denied"
                  ? "Alerts are blocked. Allow notifications for this site in your browser settings."
                  : hydrated && s.alerts && permission === "granted"
                    ? "On. You’ll get bookings, messages and payments as they happen."
                    : "Get bookings, messages and payment updates even when the app is closed."}
            </span>
          </div>
          {permission !== "unsupported" && permission !== "denied" && (
            hydrated && s.alerts && permission === "granted" ? (
              <div className={styles.alertActions}>
                <button type="button" className={styles.link} onClick={() => actions.testAlert()}>
                  Send a test
                </button>
                <button type="button" className={styles.link} onClick={() => actions.setAlerts(false)}>
                  Turn off
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-dark" onClick={turnOn}>
                Turn on
              </button>
            )
          )}
        </section>

        {hydrated && (
          <ul className={styles.list}>
            {notes.map((n) => {
              const Icon = ICONS[n.kind];
              const isUnread = !s.notifRead.includes(n.id);
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    className={`${styles.item} ${isUnread ? styles.unread : ""}`}
                    onClick={() => actions.markNotificationsRead([n.id])}
                  >
                    <span className={`${styles.icon} ${styles[n.kind]}`}>
                      <Icon size={18} />
                    </span>
                    <span className={styles.text}>
                      <strong>{n.title}</strong>
                      <span>{n.body}</span>
                      <time>{noteTime(n.at)}</time>
                    </span>
                    {isUnread && <span className={styles.dot} aria-label="Unread" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
