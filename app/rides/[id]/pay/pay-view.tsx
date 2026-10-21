"use client";

/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { methodLabels, tripSplit } from "@/lib/payment";
import { placeById } from "@/lib/places";
import { dayLabels, formatClock, rupees } from "@/lib/rides";
import { actions, bookingFor, findRide, useHydrated, useMe, useStore, type PayMethod } from "@/lib/store";
import { Avatar } from "../../../ui/avatar";
import { RateDriver } from "../../../ui/rate-driver";
import styles from "./pay.module.css";

const UPI_ID = /^[a-z0-9._-]{2,}@[a-z]{2,}$/i;

// Demo: picking an app shows which one you'd pay with; no real UPI request is made.
const UPI_APPS = ["Google Pay", "PhonePe", "Paytm", "BHIM"] as const;

// Ways to pay on this screen (monthly settle-up is offered on the trip summary).
type Method = Exclude<PayMethod, "settle-up" | "wallet">;

export function PayView({ rideId }: { rideId: string }) {
  const s = useStore();
  const me = useMe();
  const hydrated = useHydrated();
  const [method, setMethod] = useState<Method | null>(null);
  const [upiId, setUpiId] = useState("");
  const [upiApp, setUpiApp] = useState<(typeof UPI_APPS)[number]>(UPI_APPS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ride = findRide(s, rideId);
  const booking = bookingFor(s, rideId);
  const payment = s.payments[rideId];

  if (!hydrated) return <div className={styles.screen} />;
  if (!ride || !booking) {
    return (
      <div className={styles.screen}>
        <Header back="/trips" />
        <p className={styles.muted}>There’s nothing to pay on this ride.</p>
      </div>
    );
  }

  const split = tripSplit(ride, booking.segment, booking.seats, me.name);
  const amount = split.youPay;
  const first = split.driver.name.split(" ")[0];
  const chosen: Method = method ?? "upi-app";

  const cta: Record<Method, string> = {
    "upi-app": `Pay ${rupees(amount)} with ${upiApp}`,
    "upi-id": `Request ${rupees(amount)} on UPI`,
    cash: `I’ll pay ${rupees(amount)} in cash`,
  };

  function pay() {
    if (chosen === "upi-id" && !UPI_ID.test(upiId.trim())) {
      setError("Enter a UPI ID like name@bank");
      return;
    }
    setError("");
    setBusy(true);
    // Demo: a short pause stands in for the payment gateway.
    window.setTimeout(() => {
      actions.pay(rideId, chosen, amount, chosen === "upi-id" ? upiId.trim().toLowerCase() : chosen === "upi-app" ? upiApp : undefined);
      setBusy(false);
    }, chosen === "cash" ? 500 : 1400);
  }

  if (payment) {
    return (
      <div className={styles.screen}>
        <div className={styles.success} role="status">
          <span className={styles.successBadge}>
            <img src="/figma/icon-check-dark.svg" alt="" width={28} height={28} />
          </span>
          <h1>
            {payment.status === "pending"
              ? `Hand ${rupees(payment.amount)} to ${first}`
              : payment.status === "settle-requested"
                ? `Settle-up request sent to ${first}`
                : payment.status === "settle-up"
                  ? `${first} accepted your settle-up`
                  : `Paid ${rupees(payment.amount)} to ${first}`}
          </h1>
          <p>
            {payment.status === "pending"
              ? `${first} confirms the cash in the app. You’re done once they do.`
              : payment.status === "settle-requested"
                ? `${rupees(payment.amount)} goes on your monthly settle-up once ${first} accepts.`
                : `${methodLabels[payment.method]}${payment.upiId ? ` · ${payment.upiId}` : ""}`}
          </p>
          {payment.status !== "pending" && (
            <div className={styles.rateWrap}>
              <RateDriver rideId={ride.id} driver={split.driver} />
            </div>
          )}
          <div className={styles.successActions}>
            <Link href="/trips" className="btn btn-primary btn-block">
              Done
            </Link>
            <Link href={`/rides/${ride.id}`} className="btn btn-block">
              View ride
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <Header back={`/rides/${ride.id}/complete`} />

      <section className={styles.summary}>
        <Avatar person={split.driver} size={50} />
        <p className={styles.payee}>
          {split.driver.name}
          {split.driver.verified && <img src="/figma/verified-small.svg" alt="Verified" width={13.8884} height={13.8875} />}
        </p>
        <p className={`${styles.amount} tnum`}>{rupees(amount)}</p>
        <p className={styles.what}>
          Fuel contribution · {dayLabels[ride.day]}, {formatClock(split.arrive)}
        </p>
        <span className={styles.route}>
          {placeById[booking.segment.from].name} → {placeById[booking.segment.to].name}
        </span>
      </section>

      <section className={styles.methods}>
        <h2>Pay with</h2>
        <div role="radiogroup" aria-label="Payment method" className={styles.list}>
          <Option
            id="upi-app"
            chosen={chosen}
            onPick={setMethod}
            icon={<img src="/figma/icon-upi.svg" alt="" width={24} height={24} />}
            title="UPI app"
            sub="Google Pay, PhonePe, Paytm or BHIM"
          >
            {chosen === "upi-app" && (
              <div className={styles.apps} role="radiogroup" aria-label="UPI app">
                {UPI_APPS.map((app) => (
                  <button key={app} type="button" role="radio" aria-checked={upiApp === app} className={styles.app} onClick={() => setUpiApp(app)}>
                    {app}
                  </button>
                ))}
              </div>
            )}
          </Option>
          <Option id="upi-id" chosen={chosen} onPick={setMethod} icon={<span className={styles.glyph}>@</span>} title="UPI ID" sub="Enter your UPI ID, like name@bank">
            {chosen === "upi-id" && (
              <div className={styles.upiField}>
                <input
                  value={upiId}
                  onChange={(e) => {
                    setUpiId(e.target.value.replace(/\s/g, ""));
                    setError("");
                  }}
                  placeholder="yourname@okbank"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-label="Your UPI ID"
                  aria-invalid={!!error}
                  autoFocus
                />
                {error && (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                )}
              </div>
            )}
          </Option>
          <Option
            id="cash"
            chosen={chosen}
            onPick={setMethod}
            icon={<span className={styles.glyph}>₹</span>}
            title="Cash to driver"
            sub={`Hand ${rupees(amount)} to ${first} - they confirm in the app`}
          />
        </div>
      </section>

      <p className={styles.secure}>
        <img src="/figma/icon-lock-small.svg" alt="" width={11} height={12} />
        Secure payment. {first} only sees that you have paid, not your account details.
      </p>

      <div className={styles.footer}>
        <button type="button" className={styles.payButton} onClick={pay} disabled={busy}>
          {busy ? (
            <>
              <span className={styles.spinner} aria-hidden />
              Processing…
            </>
          ) : (
            <>
              <img src="/figma/icon-lock-white.svg" alt="" width={12} height={14} />
              {cta[chosen]}
            </>
          )}
        </button>
        <p className={styles.demo}>Demo: no real money moves.</p>
      </div>
    </div>
  );
}

function Header({ back }: { back: string }) {
  return (
    <header className={styles.header}>
      <Link href={back} aria-label="Back" className={styles.back}>
        <img src="/figma/back-circle.svg" alt="" width={39} height={39} />
      </Link>
      <h1>Payment</h1>
    </header>
  );
}

function Option({
  id,
  chosen,
  onPick,
  icon,
  title,
  sub,
  disabled,
  children,
}: {
  id: Method;
  chosen: Method;
  onPick: (m: Method) => void;
  icon: ReactNode;
  title: string;
  sub: string;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const on = chosen === id;
  return (
    <div className={`${styles.option} ${on ? styles.on : ""} ${disabled ? styles.disabled : ""}`}>
      <button type="button" role="radio" aria-checked={on} disabled={disabled} className={styles.optionRow} onClick={() => onPick(id)}>
        <span className={styles.optionIcon}>{icon}</span>
        <span className={styles.optionText}>
          <strong>{title}</strong>
          <span>{sub}</span>
        </span>
        <img src={on ? "/figma/radio-on.svg" : "/figma/radio-off.svg"} alt="" width={25} height={25} className={styles.radio} />
      </button>
      {children}
    </div>
  );
}
