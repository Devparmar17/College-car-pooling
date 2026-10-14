"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type CSSProperties } from "react";
import { actions, pendingRequests, useStore, type Mode } from "@/lib/store";
import styles from "./bottom-nav.module.css";

type Slot = "left" | "middle" | "right";

type Tab = { slot: Slot; href: string; label: string; icon: string };

// The middle tab follows the commute mode: riders get Commute, drivers get Earnings.
const tabsFor: Record<Mode, Tab[]> = {
  find: [
    { slot: "left", href: "/", label: "Home", icon: "/figma/nav-home.svg" },
    { slot: "middle", href: "/trips", label: "Commute", icon: "/icons/commute.svg" },
    { slot: "right", href: "/profile", label: "Profile", icon: "/icons/profile.svg" },
  ],
  offer: [
    { slot: "left", href: "/offer", label: "Home", icon: "/figma/nav-home.svg" },
    { slot: "middle", href: "/earnings", label: "Earnings", icon: "/figma/nav-payments.svg" },
    { slot: "right", href: "/profile", label: "Profile", icon: "/icons/profile.svg" },
  ],
};

/** The mode a page belongs to, or null for pages both modes share (profile, ride details). */
function modeOf(pathname: string): Mode | null {
  if (pathname === "/" || pathname.startsWith("/find")) return "find";
  if (pathname.startsWith("/offer") || pathname.startsWith("/earnings") || pathname.startsWith("/requests")) return "offer";
  return null;
}

function activeSlot(pathname: string | null, mode: Mode): Slot | null {
  if (!pathname) return null;
  if (pathname.startsWith("/profile")) return "right";
  if (pathname.startsWith("/earnings") || pathname.startsWith("/requests")) return "middle";
  if (pathname.startsWith("/trips")) return mode === "find" ? "middle" : "right";
  return "left";
}

export function BottomNav() {
  const pathname = usePathname();
  const s = useStore();
  const mode = modeOf(pathname) ?? s.mode;
  const requests = pendingRequests(s).length;

  // Remember the mode of the last mode-specific page, so shared pages keep the same bar.
  useEffect(() => {
    const m = modeOf(pathname);
    if (m) actions.setMode(m);
  }, [pathname]);

  // No bar on the login and sign-up screens, or during checkout (trip complete and payment).
  if (pathname.startsWith("/login") || pathname.startsWith("/signup") || /^\/rides\/[^/]+\/(complete|pay)$/.test(pathname)) return null;

  return <NavLinks pathname={pathname} mode={mode} requests={requests} />;
}

/**
 * Figma "Component 10": a floating bottom bar on phones and tablets, a left sidebar with the
 * UniGo brand on wide screens. Rendered without a pathname while the real one is still resolving.
 */
export function NavLinks({
  pathname = null,
  mode = "find",
  requests = 0,
}: {
  pathname?: string | null;
  mode?: Mode;
  /** Passenger requests waiting for the driver; badged on Earnings. */
  requests?: number;
}) {
  const active = activeSlot(pathname, mode);
  return (
    <nav className={styles.nav} aria-label="Main">
      <Link href={mode === "offer" ? "/offer" : "/"} className={styles.brand} aria-label="UniGo home">
        <Image src="/figma/unigo-logo.png" alt="" width={26} height={35} />
        <span>
          <strong>UniGo</strong>
          <small>Carpool with your campus</small>
        </span>
      </Link>
      {active && <span className={`${styles.highlight} ${styles[active]}`} aria-hidden />}
      {tabsFor[mode].map((t) => {
        const on = t.slot === active;
        return (
          <Link
            key={t.slot}
            href={t.href}
            className={`${styles.tab} ${styles[`at_${t.slot}`]} ${on ? styles.on : ""}`}
            aria-current={on ? "page" : undefined}
            aria-label={mode === "offer" && t.slot === "middle" && requests ? `${t.label}, ${requests} new requests` : t.label}
          >
            <span
              className={styles.icon}
              // The active icon is 32px and the others 26px, as in the Figma bar.
              style={{ "--icon": `url(${t.icon})`, "--size": `${on ? 32 : 26}px` } as CSSProperties}
              aria-hidden
            />
            <span className={styles.label}>{t.label}</span>
            {mode === "offer" && t.slot === "middle" && requests > 0 && (
              <span key={requests} className={styles.badge} aria-hidden>
                {requests}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
