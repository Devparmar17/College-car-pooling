import type { Metadata } from "next";
import { PageHeader } from "../ui/page-header";
import { EarningsView } from "./earnings-view";

export const metadata: Metadata = { title: "Earnings" };

export default function EarningsPage() {
  return (
    <>
      <PageHeader title="Earnings" />
      <EarningsView />
    </>
  );
}
