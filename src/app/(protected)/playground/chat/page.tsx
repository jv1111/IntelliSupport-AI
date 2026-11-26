import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { PlaygroundChat } from "@/components/playground/playground-chat";
import { PageLoadingFallback } from "@/components/layout/page-loading-fallback";
import { getCurrentUser } from "@/server/auth/current-user";
import { getPlaygroundChatData } from "@/server/loaders/playground-chat";
import { AutoReplyError } from "@/server/services/auto-replies";
import { ProductError } from "@/server/services/products";

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

  const playgroundChatData = await getPlaygroundChatData(
    user.id,
    productId,
  ).catch((error: unknown) => {
    if (
      (error instanceof ProductError && error.code === "NOT_FOUND") ||
      (error instanceof AutoReplyError && error.code === "NOT_FOUND")
    ) {
      notFound();
    }

    throw error;
  });

  return <PlaygroundChat {...playgroundChatData} />;
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
