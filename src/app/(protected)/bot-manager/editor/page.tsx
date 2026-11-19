import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageLoadingFallback } from "@/components/layout/page-loading-fallback";
import { ProductAutoReplies } from "@/components/bot-manager/product-auto-replies";

interface BotManagerEditorPageProps {
  searchParams: Promise<{ productId?: string | string[] }>;
}

async function BotManagerEditorContent({
  searchParams,
}: BotManagerEditorPageProps) {
  const { productId } = await searchParams;

  if (typeof productId !== "string") {
    notFound();
  }

  return <ProductAutoReplies productId={productId} />;
}

export default function BotManagerEditorPage({
  searchParams,
}: BotManagerEditorPageProps) {
  return (
    <Suspense
      fallback={<PageLoadingFallback message="Loading bot manager..." />}
    >
      <BotManagerEditorContent searchParams={searchParams} />
    </Suspense>
  );
}
