import type { Metadata } from "next";
import { Suspense } from "react";
import { ModeToggle } from "../ui/mode-toggle";
import { OfferForm } from "./offer-form";

export const metadata: Metadata = { title: "Offer a ride" };

export default function OfferPage() {
  return (
    <>
      <ModeToggle active="offer" />
      <Suspense>
        <OfferForm />
      </Suspense>
    </>
  );
}
