"use client";

import { useState, type FormEvent } from "react";
import { PhoneIcon } from "../ui/icons";
import { actions, useHydrated, useStore } from "@/lib/store";
import styles from "./phone-card.module.css";

// Indian mobile numbers: 10 digits starting with 6–9.
const MOBILE = /^[6-9]\d{9}$/;

/** "98765 43210" */
function pretty(n: string) {
  return `${n.slice(0, 5)} ${n.slice(5)}`;
}

/** Your mobile number: add it, or change it, so drivers and riders can call you. */
export function PhoneCard() {
  const { phone } = useStore();
  const hydrated = useHydrated();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function start() {
    setValue(phone ?? "");
    setError("");
    setEditing(true);
  }

  function save(e: FormEvent) {
    e.preventDefault();
    if (!MOBILE.test(value)) return setError("Enter a 10-digit mobile number starting with 6, 7, 8 or 9");
    actions.setPhone(value);
    setEditing(false);
  }

  if (!hydrated) return null;

  return (
    <section className={styles.card} aria-labelledby="phone-title">
      <span className={styles.icon} aria-hidden>
        <PhoneIcon size={20} />
      </span>
      {editing ? (
        <form className={styles.form} onSubmit={save} noValidate>
          <label id="phone-title" htmlFor="phone-input" className={styles.label}>
            Mobile number
          </label>
          <div className={`${styles.input} ${error ? styles.invalid : ""}`}>
            <span>+91</span>
            <input
              id="phone-input"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={value}
              placeholder="98765 43210"
              onChange={(e) => {
                setValue(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "phone-error" : undefined}
              autoFocus
            />
          </div>
          {error && (
            <p id="phone-error" className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={styles.actions}>
            <button type="button" className="btn" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="btn btn-primary">Save</button>
          </div>
        </form>
      ) : (
        <>
          <span className={styles.text}>
            <strong id="phone-title">Mobile number</strong>
            {/* Re-keyed on change, so a newly saved number animates in with a tick. */}
            <span key={phone ?? "none"} className={phone ? styles.saved : undefined}>
              {phone ? `✓ +91 ${pretty(phone)}` : "Add it so your driver or riders can call you"}
            </span>
          </span>
          <button type="button" className={styles.change} onClick={start}>
            {phone ? "Change" : "Add"}
          </button>
        </>
      )}
    </section>
  );
}
