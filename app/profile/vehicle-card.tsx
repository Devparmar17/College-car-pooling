"use client";

/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { myVehicle } from "@/lib/data";
import { fileSize } from "@/lib/rides";
import { actions, useHydrated, useStore, type DriverDoc } from "@/lib/store";
import { CarIcon, CheckIcon } from "../ui/icons";
import styles from "./vehicle-card.module.css";

const MAX_BYTES = 5 * 1024 * 1024;

const docs = [
  { kind: "licence", title: "Driving licence", hint: "Front side · photo or PDF, up to 5 MB", icon: "/figma/icon-id-card.svg" },
  { kind: "rc", title: "Vehicle RC", hint: "Registration certificate · photo or PDF, up to 5 MB", icon: "/figma/icon-car.svg" },
] as const;

/** Your car plus driver verification: upload the licence and RC, submit, get verified. */
export function VehicleCard() {
  const { driver } = useStore();
  const hydrated = useHydrated();
  const status = hydrated ? driver.status : "none";
  const ready = !!driver.licence && !!driver.rc;
  const router = useRouter();

  // The moment the review passes, take the new driver straight to offering a ride.
  const was = useRef(status);
  useEffect(() => {
    if (was.current === "checking" && status === "verified") router.push("/offer?verified=1");
    was.current = status;
  }, [status, router]);

  return (
    <section id="driver" className={styles.anchor}>
      <h2 className="section-title">Your vehicle</h2>
      <div className={styles.card}>
        {/* The car and its number plate come from the RC, so they only show once it is verified. */}
        <div className={styles.vehicle}>
          <CarIcon size={24} />
          {status === "verified" ? (
            <>
              <div>
                <strong>{myVehicle.model}</strong>
                <span>{myVehicle.color}</span>
              </div>
              <span className={styles.plate}>{myVehicle.plate}</span>
            </>
          ) : (
            <div>
              <strong>No vehicle added yet</strong>
              <span>Your car and number plate show here once your RC is verified.</span>
            </div>
          )}
        </div>

        <div className={styles.statusRow}>
          {status === "verified" ? (
            <span className={`${styles.badge} ${styles.verified}`}>
              <img src="/figma/verified-small.svg" alt="" width={13.8884} height={13.8875} />
              Verified driver
            </span>
          ) : status === "checking" ? (
            <span className={`${styles.badge} ${styles.checking}`} role="status">
              <span className={styles.spinner} aria-hidden />
              Checking documents…
            </span>
          ) : (
            <span className={styles.badge}>Not verified · needed to offer rides</span>
          )}
        </div>

        <ul className={styles.docs}>
          {docs.map((d) => (
            <DocRow
              key={d.kind}
              title={d.title}
              hint={d.hint}
              icon={d.icon}
              doc={hydrated ? driver[d.kind] : null}
              verified={status === "verified"}
              locked={status === "checking"}
              onPick={(doc) => actions.uploadDriverDoc(d.kind, doc)}
            />
          ))}
        </ul>

        {status !== "verified" && (
          <>
            <button
              type="button"
              className={`btn btn-primary btn-block ${styles.submit}`}
              disabled={!ready || status === "checking"}
              onClick={() => actions.submitDriverDocs()}
            >
              {status === "checking" ? "Checking…" : ready ? "Submit for verification" : "Upload both documents to submit"}
            </button>
            <p className={styles.note}>Demo: files stay on this device and are approved automatically.</p>
          </>
        )}
      </div>
    </section>
  );
}

function DocRow({
  title,
  hint,
  icon,
  doc,
  verified,
  locked,
  onPick,
}: {
  title: string;
  hint: string;
  icon: string;
  doc: DriverDoc | null;
  verified: boolean;
  locked: boolean;
  onPick: (doc: DriverDoc) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  function pick(f: File | undefined) {
    if (!f) return;
    if (!/^image\/|application\/pdf/.test(f.type)) return setError("Use a photo or a PDF");
    if (f.size > MAX_BYTES) return setError("That file is over 5 MB");
    setError("");
    onPick({ name: f.name, size: f.size });
  }

  return (
    <li className={styles.doc}>
      <span className={styles.docIcon}>
        <img src={icon} alt="" width={icon.includes("car") ? 30 : 20} height={icon.includes("car") ? 30 : 20} />
      </span>
      <span className={styles.docText}>
        <strong>{title}</strong>
        <span className={error ? styles.error : doc ? styles.done : undefined}>
          {error || (doc ? `${doc.name} · ${fileSize(doc.size)}` : hint)}
        </span>
      </span>
      {verified ? (
        <span className={styles.tick} aria-label="Verified">
          <CheckIcon size={16} />
        </span>
      ) : (
        <>
          <button type="button" className={styles.upload} disabled={locked} onClick={() => input.current?.click()}>
            {doc ? "Change" : "Upload"}
          </button>
          <input
            ref={input}
            type="file"
            accept="image/*,application/pdf"
            hidden
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </>
      )}
    </li>
  );
}
