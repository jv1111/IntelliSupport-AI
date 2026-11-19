import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageLoadingFallback } from "@/components/layout/page-loading-fallback";
import { AutoReplyFollowups } from "@/components/bot-manager/auto-reply-followups";
import { initialBotProducts } from "@/components/bot-manager/data";

interface BotManagerFollowUpsPageProps {
  searchParams: Promise<{
    productId?: string | string[];
    parentId?: string | string[];
  }>;
}

async function BotManagerFollowUpsContent({
  searchParams,
}: BotManagerFollowUpsPageProps) {
  const { productId, parentId } = await searchParams;

  if (
    typeof productId !== "string" ||
    typeof parentId !== "string" ||
    !initialBotProducts.some((product) => product.id === productId)
  ) {
    notFound();
  }

  return (
    <AutoReplyFollowups
      key={`${productId}:${parentId}`}
      productId={productId}
      parentId={parentId}
    />
  );
}

export default function BotManagerFollowUpsPage({
  searchParams,
}: BotManagerFollowUpsPageProps) {
  return (
    <Suspense
      fallback={<PageLoadingFallback message="Loading bot manager..." />}
    >
      <BotManagerFollowUpsContent searchParams={searchParams} />
    </Suspense>
  );
}
