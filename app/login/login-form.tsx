"use client";

/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { UNIVERSITY, UNIVERSITY_DOMAIN as DOMAIN } from "@/lib/data";
import { actions } from "@/lib/store";
import auth from "../ui/auth/auth.module.css";
import styles from "./login.module.css";

const EMAIL_NAME = /^[a-z0-9]+([._-][a-z0-9]+)*$/i;
const ID_NUMBER = /^[a-z0-9-]{4,20}$/i;

export function LoginForm() {
  const router = useRouter();
  const [method, setMethod] = useState<"email" | "id">("email");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const byEmail = method === "email";

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (byEmail ? !EMAIL_NAME.test(v) : !ID_NUMBER.test(v)) {
      setError(byEmail ? "Enter the part of your university email before the @" : "Enter your enrollment or employee ID");
      return;
    }
    actions.startVerification({ flow: "login", email: byEmail ? `${v.toLowerCase()}${DOMAIN}` : `ID ${v.toUpperCase()}` });
    router.push("/login/verify");
  }

  function switchMethod() {
    setMethod(byEmail ? "id" : "email");
    setValue("");
    setError("");
  }

  return (
    <div className={styles.screen}>
      <div className={styles.map} aria-hidden>
        <img src="/figma/login-map.png" alt="" className={styles.mapImage} />
        <div className={styles.fade} />
      </div>

      <form className={`${styles.content} stagger`} onSubmit={submit} noValidate>
        <div className={styles.intro}>
          <div className={styles.brand}>
            <Image src="/figma/unigo-logo.png" alt="" width={35} height={47} priority />
            <div>
              <p className={styles.brandName}>UniGo</p>
              <p className={styles.brandTag}>Carpool with your campus</p>
            </div>
          </div>
          <p className={styles.badge}>
            <img src="/figma/verified-small.svg" alt="" width={13.8884} height={13.8875} />
            Only for {UNIVERSITY} students, faculty &amp; staff
          </p>
        </div>

        <div className={auth.field}>
          <label className={auth.label} htmlFor="login-id">
            {byEmail ? "University email" : "Enrollment / Employee ID"}
          </label>
          <div className={`${auth.input} ${error ? auth.invalid : ""}`}>
            {byEmail ? (
              <img src="/figma/icon-mail.svg" alt="" width={20} height={20} />
            ) : (
              <img src="/figma/icon-id-card.svg" alt="" width={20} height={20} />
            )}
            <input
              id="login-id"
              value={value}
              onChange={(e) => {
                setValue(e.target.value.replace(byEmail ? /@.*$/ : /\s/g, ""));
                setError("");
              }}
              placeholder={byEmail ? "yourname" : "e.g. IU2241050012"}
              autoComplete={byEmail ? "username" : "off"}
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={!!error}
              aria-describedby="login-help"
            />
            {byEmail && <span className={auth.domain}>{DOMAIN}</span>}
          </div>
          <p id="login-help" className={error ? auth.error : auth.helper} role={error ? "alert" : undefined}>
            {error ||
              (byEmail
                ? "We’ll send a 6-digit login code to this email"
                : "We’ll send a 6-digit code to the university email linked to this ID")}
          </p>
        </div>

        <div className={styles.actions}>
          <button className={auth.primary}>Send login code</button>
          <p className={auth.or}>or</p>
          <button type="button" className={auth.secondary} onClick={switchMethod}>
            <img src={byEmail ? "/figma/icon-id-card.svg" : "/figma/icon-mail.svg"} alt="" width={20} height={20} />
            {byEmail ? "Log in with Enrollment / Employee ID" : "Log in with university email"}
          </button>
        </div>

        <div className={styles.foot}>
          <p>
            New to Unigo?{" "}
            <Link href="/signup" className={auth.link}>
              Create account
            </Link>
          </p>
          <p>By continuing, you agree to the Terms and Campus Safety Policy</p>
        </div>
      </form>
    </div>
  );
}
