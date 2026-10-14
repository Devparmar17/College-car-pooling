import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "../../../ui/page-header";
import { ChatView } from "./chat-view";

export const metadata: Metadata = { title: "Chat" };

export default function ChatPage({ params }: PageProps<"/rides/[id]/chat">) {
  return (
    <Suspense fallback={<PageHeader title="Chat" back="/trips" />}>
      <ChatLoader params={params} />
    </Suspense>
  );
}

async function ChatLoader({ params }: { params: PageProps<"/rides/[id]/chat">["params"] }) {
  const { id } = await params;
  return <ChatView rideId={id} />;
}
