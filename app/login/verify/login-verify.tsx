"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { actions, useHydrated, useStore } from "@/lib/store";
import { AuthHeader } from "../../ui/auth/auth-header";
import auth from "../../ui/auth/auth.module.css";
import { OtpInput } from "../../ui/auth/otp-input";
import { Resend } from "../../ui/auth/resend";

/** Code entry after "Send login code", built from step 1 of the Figma OTP screen. */
export function LoginVerify() {
  const { pending } = useStore();
  const hydrated = useHydrated();
  const router = useRouter();
  const [code, setCode] = useState("");
  // Set once the code is accepted, so the cleared pending login doesn't flash the "expired" view.
  const [done, setDone] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (code.length === 6) {
      setDone(true);
      actions.completeVerification();
      // A fresh request lets proxy.ts see the new session cookie.
      router.replace("/");
      router.refresh();
    }
  }

  if (hydrated && !done && pending?.flow !== "login") {
    return (
      <div className={auth.screen}>
        <AuthHeader title="Log in" subtitle="Your code has expired" back="/login" />
        <p className={auth.stepText}>Start again from the login screen to get a new code.</p>
        <div className={auth.footer}>
          <Link href="/login" className={auth.primary}>
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  const target = pending?.flow === "login" ? pending.email : "";

  return (
    <form className={auth.screen} onSubmit={submit}>
      <AuthHeader title="Log in" subtitle="Check your university inbox" back="/login" />

      <div className={auth.step} style={{ marginTop: 22 }}>
        <p className={auth.stepTitle}>
          <span className={auth.stepNumber}>1</span>
          Enter your login code
        </p>
        <p className={auth.stepText}>
          {target.startsWith("ID ") ? (
            <>
              Enter the 6-digit code sent to the email linked to <strong>{target.slice(3)}</strong>
            </>
          ) : (
            <>
              Enter the 6-digit code sent to <strong>{target}</strong>
            </>
          )}
        </p>
        <OtpInput value={code} onChange={setCode} />
        <Resend />
        <p className={auth.demoNote}>Demo: no email is sent. Any 6 digits will log you in.</p>
      </div>

      <div className={auth.footer}>
        <button className={auth.primary} disabled={code.length !== 6}>
          Continue
        </button>
        <p className={auth.footnote}>
          Wrong email?{" "}
          <Link href="/login" className={auth.link}>
            Change it
          </Link>
        </p>
      </div>
    </form>
  );
}
