"use client";

/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { UNIVERSITY } from "@/lib/data";
import { actions, useHydrated, useStore } from "@/lib/store";
import { AuthHeader } from "../../ui/auth/auth-header";
import auth from "../../ui/auth/auth.module.css";
import { OtpInput } from "../../ui/auth/otp-input";
import { Resend } from "../../ui/auth/resend";
import styles from "./verify.module.css";

const MAX_BYTES = 5 * 1024 * 1024;

export function SignupVerify() {
  const { pending } = useStore();
  const hydrated = useHydrated();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  // Set once the code is accepted, so the cleared pending login doesn't flash the "expired" view.
  const [done, setDone] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  if (hydrated && !done && pending?.flow !== "signup") {
    return (
      <div className={auth.screen}>
        <AuthHeader title="Create account" subtitle="Your details are missing" back="/signup" />
        <p className={auth.stepText}>Fill in your details first, then we’ll send the code.</p>
        <div className={auth.footer}>
          <Link href="/signup" className={auth.primary}>
            Back to step 1
          </Link>
        </div>
      </div>
    );
  }

  const email = pending?.flow === "signup" ? pending.email : "";
  const ready = code.length === 6 && !!file;

  function pick(f: File | undefined) {
    if (!f) return;
    if (!/^image\/|application\/pdf/.test(f.type)) return setFileError("Use a photo or a PDF of your ID card");
    if (f.size > MAX_BYTES) return setFileError("That file is over 5 MB");
    setFileError("");
    setFile(f);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (ready) {
      setDone(true);
      actions.completeVerification();
      // A fresh request lets proxy.ts see the new session cookie.
      router.replace("/");
      router.refresh();
    }
  }

  return (
    <form className={auth.screen} onSubmit={submit}>
      <AuthHeader title="Create account" subtitle="Step 2 of 2 · Verify" back="/signup" steps={2} />

      <div className={`${styles.body} stagger`}>
        <div className={styles.steps}>
          <section className={auth.step}>
            <h2 className={auth.stepTitle}>
              <span className={auth.stepNumber}>1</span>
              Verify your university email
            </h2>
            <p className={auth.stepText}>
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
            <OtpInput value={code} onChange={setCode} />
            <Resend />
          </section>

          <section className={auth.step}>
            <h2 className={auth.stepTitle}>
              <span className={auth.stepNumber}>2</span>
              Add your university ID card
            </h2>
            <div className={`${styles.upload} ${file ? styles.uploaded : ""}`}>
              <span className={styles.uploadIcon}>
                <img src="/figma/icon-camera.svg" alt="" width={24} height={24} />
              </span>
              <span className={styles.uploadText}>
                <strong>{file ? file.name : "Upload university ID card"}</strong>
                <span>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · ready to send` : "Front side · photo or PDF, up to 5 MB"}</span>
              </span>
              <button type="button" className={styles.uploadButton} onClick={() => fileRef.current?.click()}>
                {file ? "Change" : "Upload"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                hidden
                onChange={(e) => pick(e.target.files?.[0])}
              />
            </div>
            {fileError && <p className={auth.error} role="alert">{fileError}</p>}
            <p className={styles.privacy}>
              <img src="/figma/icon-lock.svg" alt="" width={16} height={16} />
              Only used to confirm you belong to {UNIVERSITY}. Never shown to other riders.
            </p>
          </section>
        </div>

        <div className={styles.driver}>
          <img src="/figma/icon-car.svg" alt="" width={30} height={30} />
          <div className={auth.inter}>
            <strong>Will you also offer rides?</strong>
            <span>Add your driving licence and vehicle RC later from Profile → Driver verification.</span>
          </div>
        </div>

        <p className={auth.demoNote}>Demo: no email is sent and the ID stays on your device. Any 6 digits work.</p>
      </div>

      <div className={auth.footer}>
        <button className={auth.primary} disabled={!ready}>
          Continue
        </button>
        <p className={styles.note}>Verification usually takes under 2 minutes</p>
      </div>
    </form>
  );
}
