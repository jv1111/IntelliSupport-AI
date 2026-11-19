"use client";

import { PackageOpen, Trash2 } from "lucide-react";
import { AutoReplyForm } from "@/components/bot-manager/auto-reply-form";
import { useAutoReplyFollowups } from "@/components/bot-manager/hooks/use-auto-reply-followups";
import { FollowupsView } from "@/components/bot-manager/views/followups-view";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";

interface AutoReplyFollowupsProps {
  productId: string;
  parentId: string;
}

export function AutoReplyFollowups({
  productId,
  parentId,
}: AutoReplyFollowupsProps) {
  const {
    view,
    productsLoading,
    productsError,
    retryProducts,
    followUps,
    form,
    deletion,
  } = useAutoReplyFollowups(productId, parentId);

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
      ) : !followUps.parent ? (
        <EmptyState
          icon={PackageOpen}
          title="Question not found"
          description="This question may have been deleted or is no longer available."
          action={
            <Button
              fullWidth={false}
              onClick={followUps.onBack}
              className="mt-4"
            >
              Back to questions
            </Button>
          }
        />
      ) : (
        <>
          {view === "followups" && (
            <FollowupsView
              parent={followUps.parent}
              productName={followUps.productName}
              followUps={followUps.items}
              maxFollowUps={followUps.maxFollowUps}
              onBack={followUps.onBack}
              onAddFollowUp={followUps.onAdd}
              onMoveReply={followUps.onMoveReply}
              onToggleReply={followUps.onToggleReply}
              onFollowUps={followUps.onFollowUps}
              onEditReply={followUps.onEditReply}
              onDeleteReply={followUps.onDeleteReply}
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
