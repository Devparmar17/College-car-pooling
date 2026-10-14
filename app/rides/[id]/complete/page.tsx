import type { Metadata } from "next";
import { Suspense } from "react";
import { TripComplete } from "./trip-complete";

export const metadata: Metadata = { title: "Trip complete" };

/** Figma "Payment split screen" (node 723:7104). */
export default function TripCompletePage({ params }: PageProps<"/rides/[id]/complete">) {
  return (
    <Suspense>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: PageProps<"/rides/[id]/complete">["params"] }) {
  const { id } = await params;
  return <TripComplete rideId={id} />;
}
