import type { Metadata } from "next";
import { Suspense } from "react";
import { PayView } from "./pay-view";

export const metadata: Metadata = { title: "Payment" };

/** Figma "Payment" (node 723:6763). */
export default function PayPage({ params }: PageProps<"/rides/[id]/pay">) {
  return (
    <Suspense>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: PageProps<"/rides/[id]/pay">["params"] }) {
  const { id } = await params;
  return <PayView rideId={id} />;
}
