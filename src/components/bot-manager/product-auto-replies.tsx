"use client";

import { PackageOpen, Trash2 } from "lucide-react";
import { AutoReplyForm } from "@/components/bot-manager/auto-reply-form";
import { useProductAutoReplies } from "@/components/bot-manager/hooks/use-product-auto-replies";
import { QuestionsView } from "@/components/bot-manager/views/questions-view";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";

interface ProductAutoRepliesProps {
  productId: string;
}

export function ProductAutoReplies({ productId }: ProductAutoRepliesProps) {
  const {
    view,
    product,
    productsLoading,
    productsError,
    retryProducts,
    questions,
    form,
    deletion,
  } = useProductAutoReplies(productId);

  return (
    <main className="mx-auto flex min-h-full w-full flex-col gap-6 p-6 sm:p-8">
      {productsLoading ? (
        <div
          className="flex min-h-48 items-center justify-center text-xs font-medium text-muted-foreground"
          role="status"
        >
          Loading product...
        </div>
      ) : productsError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 text-xs text-danger"
        >
          <span>{productsError}</span>
          <Button
            variant="text"
            onClick={retryProducts}
            className="text-danger hover:text-danger"
          >
            Try again
          </Button>
        </div>
      ) : !product ? (
        <EmptyState
          icon={PackageOpen}
          title="Product not found"
          description="This product may have been deleted or is no longer available."
          action={
            <Button
              fullWidth={false}
              onClick={questions.onBack}
              className="mt-4"
            >
              Back to products
            </Button>
          }
        />
      ) : (
        <>
          {view === "questions" && (
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
        </>
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
