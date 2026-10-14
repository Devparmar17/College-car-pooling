import type { Metadata } from "next";
import { PageHeader } from "../ui/page-header";
import { TripsView } from "./trips-view";

export const metadata: Metadata = { title: "My commutes" };

export default function TripsPage() {
  return (
    <>
      <PageHeader title="My commutes" />
      <TripsView />
    </>
  );
}
