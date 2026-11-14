import { Suspense } from "react";
import { KnowledgeBase } from "@/components/knowledge-base/knowledge-base";
import type { KnowledgeBaseStatus } from "@/lib/knowledge-base/types";

interface KnowledgeBasePageProps {
  searchParams: Promise<{ status?: string | string[] }>;
}

function KnowledgeBaseFallback() {
  return (
    <main className="mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden p-6">
      <section className="flex min-h-0 flex-1 flex-col gap-6">
        <div
          className="flex min-h-64 flex-1 items-center justify-center text-xs font-medium text-muted-foreground"
          role="status"
        >
          Loading Knowledge Base articles...
        </div>
      </section>
    </main>
  );
}

async function KnowledgeBaseContent({
  searchParams,
}: KnowledgeBasePageProps) {
  const { status } = await searchParams;

  const initialStatus: KnowledgeBaseStatus =
    status === "draft" || status === "archived" ? status : "published";

  return <KnowledgeBase initialStatus={initialStatus} />;
}

export default function KnowledgeBasePage({
  searchParams,
}: KnowledgeBasePageProps) {
  return (
    <Suspense fallback={<KnowledgeBaseFallback />}>
      <KnowledgeBaseContent searchParams={searchParams} />
    </Suspense>
  );
}
