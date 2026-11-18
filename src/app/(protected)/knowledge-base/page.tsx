import { Suspense } from "react";
import { PageLoadingFallback } from "@/components/layout/page-loading-fallback";
import { KnowledgeBase } from "@/components/knowledge-base/knowledge-base";
import type { KnowledgeBaseStatus } from "@/lib/knowledge-base/types";

interface KnowledgeBasePageProps {
  searchParams: Promise<{ status?: string | string[] }>;
}

async function KnowledgeBaseContent({ searchParams }: KnowledgeBasePageProps) {
  const { status } = await searchParams;

  const initialStatus: KnowledgeBaseStatus =
    status === "draft" || status === "archived" ? status : "published";

  return <KnowledgeBase initialStatus={initialStatus} />;
}

export default function KnowledgeBasePage({
  searchParams,
}: KnowledgeBasePageProps) {
  return (
    <Suspense
      fallback={
        <PageLoadingFallback message="Loading Knowledge Base articles..." />
      }
    >
      <KnowledgeBaseContent searchParams={searchParams} />
    </Suspense>
  );
}
