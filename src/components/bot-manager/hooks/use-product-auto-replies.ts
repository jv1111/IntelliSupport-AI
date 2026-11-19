"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { initialBotProducts } from "@/components/bot-manager/data";
import { MAX_GROUP_QUESTIONS } from "@/components/bot-manager/constants";
import { useBotManagerState } from "@/components/bot-manager/bot-manager-provider";
import { useAutoReplyActions } from "@/components/bot-manager/hooks/use-auto-reply-actions";
import { useAutoReplyForm } from "@/components/bot-manager/hooks/use-auto-reply-form";
import type { AutoReply, BotManagerView } from "@/components/bot-manager/types";

export function useProductAutoReplies(productId: string) {
  const router = useRouter();
  const { groups, replies } = useBotManagerState();

  const [view, setView] = useState<BotManagerView>("questions");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    productId,
  );
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const handleSelectedParentDeleted = useCallback(() => {
    setView("questions");
    setSelectedParentId(null);
  }, []);

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

  const product = initialBotProducts.find((item) => item.id === productId);

  const productGroups = groups.filter((group) => group.productId === productId);

  const questionsViewGroups = productGroups.map((group) => {
    const groupReplies = replies.filter(
      (reply) => reply.groupId === group.id && !reply.parentId,
    );

    return {
      group,
      isFull: groupReplies.length >= MAX_GROUP_QUESTIONS,
      replies: groupReplies.map((reply) => ({
        reply,
        followUpCount: replies.filter((item) => item.parentId === reply.id)
          .length,
      })),
    };
  });

  const openFollowUps = useCallback(
    (id: string) => {
      const parent = replies.find((reply) => reply.id === id);

      if (!parent) {
        return;
      }

      router.push(
        `/bot-manager/editor/followups?productId=${encodeURIComponent(parent.productId)}&parentId=${encodeURIComponent(parent.id)}`,
      );
    },
    [replies, router],
  );

  const backToProducts = useCallback(() => {
    router.push("/bot-manager");
  }, [router]);

  const parentQuestion = form.formParentId
    ? (replies.find((reply) => reply.id === form.formParentId)?.question ??
      null)
    : null;

  const formTitle = form.editingReplyId
    ? form.formParentId
      ? "Edit Follow-up Question"
      : "Edit Auto Reply"
    : form.formParentId
      ? "Add Follow-up Question"
      : "Add Auto Reply";

  return {
    view,
    product,
    questions: {
      groups: questionsViewGroups,
      maxQuestions: MAX_GROUP_QUESTIONS,
      onBack: backToProducts,
      onAddGroup: () => actions.addGroup(productId),
      onAddQuestion: (groupId: string) => {
        form.openForm({ productId, groupId });
      },
      onDeleteGroup: actions.requestDeleteGroup,
      onMoveGroup: actions.moveGroup,
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
      isFollowUp: Boolean(form.formParentId),
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
      confirmLabel:
        actions.pendingDeletion?.type === "group"
          ? "Delete Group"
          : "Delete Reply",
      onConfirm: actions.confirmDelete,
      onCancel: actions.cancelDelete,
    },
  };
}
