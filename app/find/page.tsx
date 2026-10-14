import type { Metadata } from "next";
import { Suspense } from "react";
import { ModeToggle } from "../ui/mode-toggle";
import { FindView } from "./find-view";

export const metadata: Metadata = { title: "Find Commute" };

export default function FindPage() {
  return (
    <>
      <ModeToggle active="find" />
      <Suspense>
        <FindView />
      </Suspense>
    </>
  );
}
