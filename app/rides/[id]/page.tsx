import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "../../ui/page-header";
import { RideDetail } from "./ride-detail";

export const metadata: Metadata = { title: "Ride" };

export default function RidePage({ params }: PageProps<"/rides/[id]">) {
  return (
    <Suspense fallback={<PageHeader title="Ride" back="/find" />}>
      <RideLoader params={params} />
    </Suspense>
  );
}

async function RideLoader({ params }: { params: PageProps<"/rides/[id]">["params"] }) {
  const { id } = await params;
  return <RideDetail id={id} />;
}
