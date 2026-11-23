import { Suspense } from "react";
import { KnowledgeBaseEditor } from "@/components/knowledge-base/knowledge-base-editor";
import { PageLoadingFallback } from "@/components/layout/page-loading-fallback";

interface EditKnowledgeBaseArticlePageProps {
  params: Promise<{ id: string }>;
}

async function EditKnowledgeBaseArticleContent({
  params,
}: EditKnowledgeBaseArticlePageProps) {
  const { id } = await params;

  return <KnowledgeBaseEditor articleId={id} />;
}

export default function EditKnowledgeBaseArticlePage({
  params,
}: EditKnowledgeBaseArticlePageProps) {
  return (
    <Suspense
      fallback={
        <PageLoadingFallback message="Loading Knowledge Base article..." />
      }
    >
      <EditKnowledgeBaseArticleContent params={params} />
    </Suspense>
  );
}
