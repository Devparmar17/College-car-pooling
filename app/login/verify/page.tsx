import type { Metadata } from "next";
import { LoginVerify } from "./login-verify";

export const metadata: Metadata = { title: "Enter login code" };

export default function LoginVerifyPage() {
  return <LoginVerify />;
}
