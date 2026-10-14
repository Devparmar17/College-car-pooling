import type { Metadata } from "next";
import { SignupVerify } from "./signup-verify";

export const metadata: Metadata = { title: "Verify your account" };

/** Figma "Create accoun/ OTP" (node 723:6613). */
export default function SignupVerifyPage() {
  return <SignupVerify />;
}
