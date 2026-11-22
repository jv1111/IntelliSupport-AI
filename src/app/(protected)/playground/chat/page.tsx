import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PlaygroundChat } from "@/components/playground/playground-chat";
import { PageLoadingFallback } from "@/components/layout/page-loading-fallback";
import { playgroundProducts } from "@/temp-data/playground-products";
import { playgroundChatData } from "@/temp-data/playground-chat";

interface PlaygroundChatPageProps {
  searchParams: Promise<{
    productId?: string | string[];
  }>;
}

async function PlaygroundChatContent({
  searchParams,
}: PlaygroundChatPageProps) {
  const { productId } = await searchParams;

  if (typeof productId !== "string") {
    notFound();
  }

  const product = playgroundProducts.find((item) => item.id === productId);
  const chat = playgroundChatData[productId];

  if (!product || !chat) {
    notFound();
  }

  return <PlaygroundChat product={product} chat={chat} />;
}

export default function PlaygroundChatPage({
  searchParams,
}: PlaygroundChatPageProps) {
  return (
    <Suspense
      fallback={<PageLoadingFallback message="Loading playground chat..." />}
    >
      <PlaygroundChatContent searchParams={searchParams} />
    </Suspense>
  );
}
