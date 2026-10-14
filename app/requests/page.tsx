import type { Metadata } from "next";
import { RequestsView } from "./requests-view";

export const metadata: Metadata = { title: "Ride requests" };

export default function RequestsPage() {
  return <RequestsView />;
}
