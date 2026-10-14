import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create account" };

/** Figma "Create account" (node 723:6534). */
export default function SignupPage() {
  return <SignupForm />;
}
