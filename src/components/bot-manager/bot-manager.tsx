"use client";

import { Trash2 } from "lucide-react";
import { AutoReplyForm } from "@/components/bot-manager/auto-reply-form";
import { useBotManager } from "@/components/bot-manager/hooks/use-bot-manager";
import { ProductsView } from "@/components/bot-manager/views/products-view";
import { QuestionsView } from "@/components/bot-manager/views/questions-view";
import { FollowupsView } from "@/components/bot-manager/views/followups-view";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface BotManagerProps {
  productId?: string;
  parentId?: string;
  isNewAutoReplyPage?: boolean;
}

export function BotManager({
  productId,
  parentId,
  isNewAutoReplyPage,
}: BotManagerProps = {}) {
  const { view, settings, products, questions, followUps, form, deletion } =
    useBotManager({ productId, parentId, isNewAutoReplyPage });

  return (
    <main className="mx-auto flex min-h-full w-full flex-col gap-6 p-6 sm:p-8">
      {view === "products" && (
        <ProductsView
          aiEnabled={settings.aiEnabled}
          autoRepliesEnabled={settings.autoRepliesEnabled}
          products={products.items}
          search={products.search}
          onAiEnabledChange={settings.setAiEnabled}
          onAutoRepliesEnabledChange={settings.setAutoRepliesEnabled}
          onAddAutoReply={products.onAddAutoReply}
          onSelectProduct={products.onSelectProduct}
          onSearchChange={products.onSearchChange}
        />
      )}

      {view === "questions" && questions.product && (
        <QuestionsView
          product={questions.product}
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
