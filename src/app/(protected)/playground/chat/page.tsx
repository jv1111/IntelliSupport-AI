import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { PlaygroundChat } from "@/components/playground/playground-chat";
import { PageLoadingFallback } from "@/components/layout/page-loading-fallback";
import { getCurrentUser } from "@/server/auth/current-user";
import { getProduct, ProductError } from "@/server/services/products";
import { getAutoReplies, AutoReplyError } from "@/server/services/auto-replies";
import { getBotSettings } from "@/server/services/bot-settings";
import { createProductImageReadUrl } from "@/server/storage/google-cloud-storage";
import type { Product } from "@/lib/products/types";
import type { AutoReply } from "@/lib/auto-replies/types";

interface PlaygroundChatPageProps {
  searchParams: Promise<{
    productId?: string | string[];
  }>;
}

async function PlaygroundChatContent({
  searchParams,
}: PlaygroundChatPageProps) {
  const { productId } = await searchParams;

  if (typeof productId !== "string" || !productId.trim()) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  let productRecord: Awaited<ReturnType<typeof getProduct>>;

  try {
    productRecord = await getProduct(user.id, productId);
  } catch (error) {
    if (error instanceof ProductError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  let autoReplyRecords: Awaited<ReturnType<typeof getAutoReplies>>;

  try {
    autoReplyRecords = await getAutoReplies(user.id, productId);
  } catch (error) {
    if (error instanceof AutoReplyError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  const botSettings = await getBotSettings(user.id);

  let imageUrl: string | null = null;

  if (productRecord.imageUrl) {
    try {
      imageUrl = await createProductImageReadUrl(productRecord.imageUrl);
    } catch (error) {
      console.error("Unable to generate playground product image URL:", {
        productId: productRecord.id,
        error,
      });
    }
  }

  const product: Product = {
    id: productRecord.id,
    name: productRecord.name,
    sku: productRecord.sku,
    status: productRecord.status,
    imageUrl,
    description: productRecord.description,
    createdAt: productRecord.createdAt.toISOString(),
    updatedAt: productRecord.updatedAt.toISOString(),
  };

  const autoReplies: AutoReply[] = autoReplyRecords.map((reply) => ({
    ...reply,
    createdAt: reply.createdAt.toISOString(),
    updatedAt: reply.updatedAt.toISOString(),
  }));

  return (
    <PlaygroundChat
      product={product}
      autoReplies={autoReplies}
      autoRepliesEnabled={botSettings.autoRepliesEnabled}
    />
  );
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
