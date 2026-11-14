import { KnowledgeBaseEditor } from "@/components/knowledge-base/knowledge-base-editor";

interface EditKnowledgeBaseArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditKnowledgeBaseArticlePage({
  params,
}: EditKnowledgeBaseArticlePageProps) {
  const { id } = await params;

  return <KnowledgeBaseEditor articleId={id} />;
}
