import { Suspense } from "react";
import { QuestionEditor } from "@/components/bot-manager/question-editor";
import { PageLoadingFallback } from "@/components/layout/page-loading-fallback";

export default function NewAutoReplyPage() {
  return (
    <Suspense
      fallback={<PageLoadingFallback message="Loading auto reply editor..." />}
    >
      <QuestionEditor />
    </Suspense>
  );
}
