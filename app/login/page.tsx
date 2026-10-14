import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

/** Figma "Login screen" (node 723:6825). */
export default function LoginPage() {
  return <LoginForm />;
}
