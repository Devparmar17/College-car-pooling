"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { CarIcon, RupeeIcon, SeatIcon, ShieldIcon } from "./icons";
import styles from "./onboarding.module.css";

const SEEN_KEY = "unigo:onboarded";
/** Fired (on window) to show the guide again, e.g. from Profile. */
export const SHOW_ONBOARDING = "unigo:show-onboarding";

const SLIDES: { Icon: ComponentType<{ size?: number }>; title: string; text: string }[] = [
  {
    Icon: CarIcon,
    title: "Rides to campus, with people you know",
    text: "Find a seat with verified Indus University students and faculty going your way, today or the next two days.",
  },
  {
    Icon: RupeeIcon,
    title: "Pay only for the fuel",
    text: "No fares to haggle over: a ride's fuel cost is shared equally by its riders. Pay by UPI, cash or monthly settle-up.",
  },
  {
    Icon: SeatIcon,
    title: "Driving anyway? Offer your seats",
    text: "Verify your driving licence and RC once, publish your commute, and accept the riders who ask to join.",
  },
  {
    Icon: ShieldIcon,
    title: "Safe by design",
    text: "Everyone is verified by the university. Use SOS during a ride, chat or call your driver, and rate every trip.",
  },
];

/**
 * First-run guide: four short screens on what UniGo does, shown once (and on request).
 * Swipe or use Next; Skip ends it at any time.
 */
export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  // While Next or a dot is sliding the screens, the scroll position is in between: ignore it.
  const sliding = useRef(0);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Storage blocked: skip the guide rather than show it every time.
    }
    // First open: the guide is ready under the launch animation, so it comes before the login screen.
    const timer = seen ? 0 : window.setTimeout(() => setOpen(true), 0);
    const replay = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener(SHOW_ONBOARDING, replay);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(SHOW_ONBOARDING, replay);
    };
  }, []);

  if (!open) return null;

  function finish() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Ignore: it just shows again next time.
    }
    setOpen(false);
  }

  function go(i: number) {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    window.clearTimeout(sliding.current);
    sliding.current = window.setTimeout(() => (sliding.current = 0), 600);
    setIndex(i);
  }

  const last = index === SLIDES.length - 1;

  return (
    <div className={styles.screen} role="dialog" aria-modal="true" aria-label="How UniGo works">
      <button type="button" className={styles.skip} onClick={finish}>
        Skip
      </button>

      <div
        ref={track}
        className={styles.track}
        // Swiping moves between screens; keep the dots in step.
        onScroll={(e) => {
          if (sliding.current) return;
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (i !== index) setIndex(i);
        }}
      >
        {SLIDES.map(({ Icon, title, text }, i) => (
          <section key={title} className={styles.slide} aria-hidden={i !== index}>
            <span className={styles.art} aria-hidden>
              <Icon size={56} />
            </span>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
      </div>

      <div className={styles.dots} role="tablist" aria-label="Screens">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Screen ${i + 1} of ${SLIDES.length}`}
            className={i === index ? styles.dotOn : styles.dot}
            onClick={() => go(i)}
          />
        ))}
      </div>

      <button type="button" className={`btn btn-primary btn-block ${styles.next}`} onClick={() => (last ? finish() : go(index + 1))}>
        {last ? "Get started" : "Next"}
      </button>
    </div>
  );
}
