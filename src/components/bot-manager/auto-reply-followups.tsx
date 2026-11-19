"use client";

import { Trash2 } from "lucide-react";
import { AutoReplyForm } from "@/components/bot-manager/auto-reply-form";
import { useAutoReplyFollowups } from "@/components/bot-manager/hooks/use-auto-reply-followups";
import { FollowupsView } from "@/components/bot-manager/views/followups-view";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface AutoReplyFollowupsProps {
  productId: string;
  parentId: string;
}

export function AutoReplyFollowups({
  productId,
  parentId,
}: AutoReplyFollowupsProps) {
  const { view, followUps, form, deletion } = useAutoReplyFollowups(
    productId,
    parentId,
  );

  return (
    <main className="mx-auto flex min-h-full w-full flex-col gap-6 p-6 sm:p-8">
      {view === "followups" && followUps.parent && (
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
