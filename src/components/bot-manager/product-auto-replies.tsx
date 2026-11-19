"use client";

import { Trash2 } from "lucide-react";
import { AutoReplyForm } from "@/components/bot-manager/auto-reply-form";
import { useProductAutoReplies } from "@/components/bot-manager/hooks/use-product-auto-replies";
import { QuestionsView } from "@/components/bot-manager/views/questions-view";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface ProductAutoRepliesProps {
  productId: string;
}

export function ProductAutoReplies({ productId }: ProductAutoRepliesProps) {
  const { view, product, questions, form, deletion } =
    useProductAutoReplies(productId);

  return (
    <main className="mx-auto flex min-h-full w-full flex-col gap-6 p-6 sm:p-8">
      {view === "questions" && product && (
        <QuestionsView
          product={product}
          groups={questions.groups}
          maxGroupQuestions={questions.maxQuestions}
          onBack={questions.onBack}
          onAddGroup={questions.onAddGroup}
          onMoveGroup={questions.onMoveGroup}
          onAddQuestion={questions.onAddQuestion}
          onDeleteGroup={questions.onDeleteGroup}
          onMoveReply={questions.onMoveReply}
          onToggleReply={questions.onToggleReply}
          onFollowUps={questions.onFollowUps}
          onEditReply={questions.onEditReply}
          onDeleteReply={questions.onDeleteReply}
        />
      )}

      {view === "form" && (
        <AutoReplyForm
          title={form.title}
          values={form.values}
          products={form.products}
          groups={form.groups}
          isFollowUp={form.isFollowUp}
          parentQuestion={form.parentQuestion}
          error={form.error}
          onChange={form.onChange}
          onSubmit={form.onSubmit}
          onCancel={form.onCancel}
        />
      )}

      <ConfirmationDialog
        open={Boolean(deletion.pending)}
        title={deletion.title}
        description={deletion.description}
        confirmLabel={deletion.confirmLabel}
        pendingLabel="Deleting..."
        variant="danger"
        icon={Trash2}
        onConfirm={deletion.onConfirm}
        onCancel={deletion.onCancel}
      />
    </main>
  );
}
