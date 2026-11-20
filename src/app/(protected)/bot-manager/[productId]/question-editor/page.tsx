import { QuestionEditor } from "@/components/bot-manager/question-editor";

interface QuestionEditorPageProps {
  params: Promise<{ productId: string }>;
}

export default async function QuestionEditorPage({
  params,
}: QuestionEditorPageProps) {
  const { productId } = await params;

  return <QuestionEditor productId={productId} />;
}
