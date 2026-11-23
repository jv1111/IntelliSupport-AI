import { Suspense } from "react";
import { QuestionEditor } from "@/components/bot-manager/question-editor";
import { PageLoadingFallback } from "@/components/layout/page-loading-fallback";

interface QuestionEditorPageProps {
  params: Promise<{ productId: string }>;
}

async function QuestionEditorContent({ params }: QuestionEditorPageProps) {
  const { productId } = await params;

  return <QuestionEditor productId={productId} />;
}

export default function QuestionEditorPage({
  params,
}: QuestionEditorPageProps) {
  return (
    <Suspense
      fallback={<PageLoadingFallback message="Loading auto reply editor..." />}
    >
      <QuestionEditorContent params={params} />
    </Suspense>
  );
}
