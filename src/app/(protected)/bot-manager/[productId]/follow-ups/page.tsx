import { Suspense } from "react";
import { FollowUpsEditor } from "@/components/bot-manager/follow-ups-editor";
import { PageLoadingFallback } from "@/components/layout/page-loading-fallback";

interface FollowUpsPageProps {
  params: Promise<{ productId: string }>;
}

async function FollowUpsContent({ params }: FollowUpsPageProps) {
  const { productId: autoReplyId } = await params;

  return <FollowUpsEditor autoReplyId={autoReplyId} />;
}

export default function FollowUpsPage({ params }: FollowUpsPageProps) {
  return (
    <Suspense
      fallback={<PageLoadingFallback message="Loading follow-ups..." />}
    >
      <FollowUpsContent params={params} />
    </Suspense>
  );
}
