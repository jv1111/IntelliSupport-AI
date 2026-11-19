"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { initialBotProducts } from "@/components/bot-manager/data";
import { MAX_FOLLOW_UPS } from "@/components/bot-manager/constants";
import { useBotManagerState } from "@/components/bot-manager/bot-manager-provider";
import { useAutoReplyActions } from "@/components/bot-manager/hooks/use-auto-reply-actions";
import { useAutoReplyForm } from "@/components/bot-manager/hooks/use-auto-reply-form";
import type { AutoReply, BotManagerView } from "@/components/bot-manager/types";

export function useAutoReplyFollowups(productId: string, parentId: string) {
  const router = useRouter();
  const { replies } = useBotManagerState();

  const [view, setView] = useState<BotManagerView>("followups");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    productId,
  );
  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    parentId,
  );

  const handleSelectedParentDeleted = useCallback(() => {
    router.replace(
      `/bot-manager/editor?productId=${encodeURIComponent(productId)}`,
    );
  }, [productId, router]);

  const form = useAutoReplyForm({
    selectedProductId,
    setSelectedProductId,
    setSelectedParentId,
    setView,
  });

  const actions = useAutoReplyActions({
    selectedParentId,
    onSelectedParentDeleted: handleSelectedParentDeleted,
  });

  const parent = replies.find((reply) => reply.id === selectedParentId);
  const followUps = replies.filter(
    (reply) => reply.parentId === selectedParentId,
  );

  const followUpsViewItems = followUps.map((reply) => ({
    reply,
    followUpCount: replies.filter((item) => item.parentId === reply.id).length,
  }));

  const productName =
    initialBotProducts.find((product) => product.id === parent?.productId)
      ?.name ?? "Product";

  const openFollowUps = useCallback(
    (id: string) => {
      const reply = replies.find((item) => item.id === id);

      if (!reply) {
        return;
      }

      router.push(
        `/bot-manager/editor/followups?productId=${encodeURIComponent(reply.productId)}&parentId=${encodeURIComponent(reply.id)}`,
      );
    },
    [replies, router],
  );

  const backFromFollowUps = useCallback(() => {
    const currentParent = replies.find(
      (reply) => reply.id === selectedParentId,
    );

    if (currentParent?.parentId) {
      router.replace(
        `/bot-manager/editor/followups?productId=${encodeURIComponent(productId)}&parentId=${encodeURIComponent(currentParent.parentId)}`,
      );
      return;
    }

    router.replace(
      `/bot-manager/editor?productId=${encodeURIComponent(productId)}`,
    );
  }, [productId, replies, router, selectedParentId]);

  const parentQuestion = form.formParentId
    ? (replies.find((reply) => reply.id === form.formParentId)?.question ??
      null)
    : null;

  const formTitle = form.editingReplyId
    ? "Edit Follow-up Question"
    : "Add Follow-up Question";

  return {
    view,
    followUps: {
      parent,
      items: followUpsViewItems,
      productName,
      maxFollowUps: MAX_FOLLOW_UPS,
      onBack: backFromFollowUps,
      onAdd: () => {
        if (parent) {
          form.openForm({
            productId: parent.productId,
            parentId: parent.id,
          });
        }
      },
      onMoveReply: actions.moveReply,
      onToggleReply: actions.toggleReply,
      onFollowUps: openFollowUps,
      onEditReply: (reply: AutoReply) => form.openForm({ reply }),
      onDeleteReply: actions.requestDeleteReply,
    },
    form: {
      title: formTitle,
      values: form.formValues,
      products: initialBotProducts,
      groups: form.formGroups,
      isFollowUp: true,
      parentQuestion,
      error: form.formError,
      onChange: form.updateFormValue,
      onSubmit: form.saveReply,
      onCancel: form.closeForm,
    },
    deletion: {
      pending: actions.pendingDeletion,
      title: actions.deletionTitle,
      description: actions.deletionDescription,
      confirmLabel: "Delete Reply",
      onConfirm: actions.confirmDelete,
      onCancel: actions.cancelDelete,
    },
  };
}
