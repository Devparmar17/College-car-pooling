"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type CSSProperties } from "react";
import { actions, useStore, type Mode } from "@/lib/store";
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
  if (pathname.startsWith("/offer") || pathname.startsWith("/earnings")) return "offer";
  return null;
}

function activeSlot(pathname: string | null, mode: Mode): Slot | null {
  if (!pathname) return null;
  if (pathname.startsWith("/profile")) return "right";
  if (pathname.startsWith("/earnings")) return "middle";
  if (pathname.startsWith("/trips")) return mode === "find" ? "middle" : "right";
  return "left";
}

export function BottomNav() {
  const pathname = usePathname();
  const stored = useStore().mode;
  const mode = modeOf(pathname) ?? stored;

  // Remember the mode of the last mode-specific page, so shared pages keep the same bar.
  useEffect(() => {
    const m = modeOf(pathname);
    if (m) actions.setMode(m);
  }, [pathname]);

  // No bar on the login and sign-up screens.
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) return null;

  return <NavLinks pathname={pathname} mode={mode} />;
}

/** Figma "Component 10". Rendered without a pathname while the real one is still resolving. */
export function NavLinks({ pathname = null, mode = "find" }: { pathname?: string | null; mode?: Mode }) {
  const active = activeSlot(pathname, mode);
  return (
    <nav className={styles.nav} aria-label="Main">
      {active && <span className={`${styles.highlight} ${styles[active]}`} aria-hidden />}
      {tabsFor[mode].map((t) => {
        const on = t.slot === active;
        return (
          <Link
            key={t.slot}
            href={t.href}
            className={`${styles.tab} ${styles[`at_${t.slot}`]} ${on ? styles.on : ""}`}
            aria-current={on ? "page" : undefined}
            aria-label={t.label}
          >
            <span
              className={styles.icon}
              // The active icon is 32px and the others 26px, as in the Figma bar.
              style={{ "--icon": `url(${t.icon})`, "--size": `${on ? 32 : 26}px` } as CSSProperties}
              aria-hidden
            />
            {!on && <span className={styles.label}>{t.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
