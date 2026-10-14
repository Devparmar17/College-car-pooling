"use client";

/* eslint-disable @next/next/no-img-element -- Figma icon assets render at their native size. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { UNIVERSITY_DOMAIN } from "@/lib/data";
import { actions, useStore, type Role } from "@/lib/store";
import { AuthHeader } from "../ui/auth/auth-header";
import auth from "../ui/auth/auth.module.css";
import styles from "./signup.module.css";

const roles: { id: Role; icon: string }[] = [
  { id: "Student", icon: "/figma/icon-school.svg" },
  { id: "Faculty", icon: "/figma/icon-person.svg" },
  { id: "Staff", icon: "/figma/icon-briefcase.svg" },
];

const departments = [
  { code: "CE", label: "Computer Engineering · B.Tech" },
  { code: "IT", label: "Information Technology · B.Tech" },
  { code: "ME", label: "Mechanical Engineering · B.Tech" },
  { code: "EC", label: "Electronics & Communication · B.Tech" },
  { code: "Civil", label: "Civil Engineering · B.Tech" },
  { code: "Design", label: "Design · M.Des" },
  { code: "Management", label: "Management · BBA / MBA" },
  { code: "Admin", label: "Administration" },
];

const EMAIL_NAME = /^[a-z0-9]+([._-][a-z0-9]+)*$/i;
const ID_NUMBER = /^[a-z0-9-]{4,20}$/i;

export function SignupForm() {
  const router = useRouter();
  const { pending } = useStore();
  // Coming back from step 2 keeps what was typed.
  const saved = pending?.flow === "signup" ? pending : null;
  const [role, setRole] = useState<Role>(saved?.role ?? "Student");
  const [name, setName] = useState(saved?.name ?? "");
  const [email, setEmail] = useState(saved?.email.replace(UNIVERSITY_DOMAIN, "") ?? "");
  const [idNumber, setIdNumber] = useState(saved?.idNumber ?? "");
  const [dept, setDept] = useState(saved?.dept ?? "");
  const [agreed, setAgreed] = useState(!!saved);
  const [tried, setTried] = useState(false);

  const isStudent = role === "Student";
  const errors = {
    name: name.trim().length < 2 ? "Enter your full name" : "",
    email: !EMAIL_NAME.test(email.trim()) ? "Enter the part of your university email before the @" : "",
    idNumber: !ID_NUMBER.test(idNumber.trim()) ? `Enter your ${isStudent ? "enrollment number" : "employee ID"}` : "",
    dept: !dept ? "Pick your department" : "",
    agreed: !agreed ? "Agree to the Terms to continue" : "",
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (k: keyof typeof errors) => (tried ? errors[k] : "");

  function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    actions.startVerification({
      flow: "signup",
      role,
      name: name.trim().replace(/\s+/g, " "),
      email: `${email.trim().toLowerCase()}${UNIVERSITY_DOMAIN}`,
      idNumber: idNumber.trim().toUpperCase(),
      dept,
    });
    router.push("/signup/verify");
  }

  return (
    <form className={auth.screen} onSubmit={submit} noValidate>
      <AuthHeader title="Create account" subtitle="Step 1 of 2 · Your details" back="/login" steps={1} />

      <div className={`${styles.body} stagger`}>
        <fieldset className={styles.roles}>
          <legend className={styles.legend}>I am a</legend>
          <div className={styles.roleRow}>
            {roles.map((r) => (
              <label key={r.id} className={styles.role}>
                <input type="radio" name="role" checked={role === r.id} onChange={() => setRole(r.id)} />
                <span>
                  <img src={r.icon} alt="" width={24} height={24} />
                  {r.id}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={styles.fields}>
          <div className={auth.field}>
            <label className={auth.label} htmlFor="su-name">
              Full name
            </label>
            <div className={`${auth.input} ${show("name") ? auth.invalid : ""}`}>
              <img src="/figma/icon-person.svg" alt="" width={24} height={24} />
              <input
                id="su-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="As on your university ID"
                autoComplete="name"
              />
            </div>
            {show("name") && <p className={auth.error}>{errors.name}</p>}
          </div>

          <div className={auth.field}>
            <label className={auth.label} htmlFor="su-email">
              University email
            </label>
            <div className={`${auth.input} ${show("email") ? auth.invalid : ""}`}>
              <img src="/figma/icon-mail-dark.svg" alt="" width={20} height={20} />
              <input
                id="su-email"
                value={email}
                onChange={(e) => setEmail(e.target.value.replace(/@.*$/, ""))}
                placeholder="yourname"
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="username"
              />
              <span className={auth.domain}>{UNIVERSITY_DOMAIN}</span>
            </div>
            <p className={show("email") ? auth.error : auth.helper}>
              {show("email") || "Must be your official university email - personal emails can’t join"}
            </p>
          </div>

          <div className={auth.field}>
            <label className={auth.label} htmlFor="su-id">
              {isStudent ? "Enrollment number" : "Employee ID"}
            </label>
            <div className={`${auth.input} ${show("idNumber") ? auth.invalid : ""}`}>
              <img src="/figma/icon-profile-fill.svg" alt="" width={24} height={24} />
              <input
                id="su-id"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value.replace(/\s/g, ""))}
                placeholder={isStudent ? "e.g. IU2241050012" : "e.g. EMP1042"}
                autoCapitalize="characters"
                spellCheck={false}
              />
            </div>
            <p className={show("idNumber") ? auth.error : auth.helper}>
              {show("idNumber") ||
                (isStudent ? "Faculty & staff: enter your Employee ID instead" : "Printed on your staff ID card")}
            </p>
          </div>

          <div className={auth.field}>
            <label className={auth.label} htmlFor="su-dept">
              Department
            </label>
            <div className={`${auth.input} ${show("dept") ? auth.invalid : ""}`}>
              <img src="/figma/icon-school.svg" alt="" width={24} height={24} />
              <select id="su-dept" value={dept} onChange={(e) => setDept(e.target.value)} className={dept ? "" : styles.placeholder}>
                <option value="" disabled>
                  Select your department
                </option>
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.label}
                  </option>
                ))}
              </select>
              <img src="/figma/icon-dropdown.svg" alt="" width={24} height={24} className={styles.chevron} />
            </div>
            {show("dept") && <p className={auth.error}>{errors.dept}</p>}
          </div>

          <label className={styles.agree}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span className={styles.box} aria-hidden>
              {agreed && <img src="/figma/icon-check.svg" alt="" width={16} height={16} />}
            </span>
            <span>
              I agree to the <span className={auth.link}>Terms</span> and the{" "}
              <span className={auth.link}>Campus Safety Policy</span>
            </span>
          </label>
          {show("agreed") && <p className={auth.error}>{errors.agreed}</p>}
        </div>

        <button className={auth.primary}>Continue</button>
        <p className={auth.footnote}>
          Already have an account?{" "}
          <Link href="/login" className={auth.link}>
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
