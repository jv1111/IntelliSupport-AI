"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { initialBotProducts } from "@/components/bot-manager/data";
import {
  MAX_FOLLOW_UPS,
  MAX_GROUP_QUESTIONS,
} from "@/components/bot-manager/constants";
import { useBotManagerState } from "@/components/bot-manager/bot-manager-provider";
import { useAutoReplyActions } from "@/components/bot-manager/hooks/use-auto-reply-actions";
import { useAutoReplyForm } from "@/components/bot-manager/hooks/use-auto-reply-form";
import type { AutoReply, BotManagerView } from "@/components/bot-manager/types";

interface UseBotManagerOptions {
  productId?: string;
  parentId?: string;
  isNewAutoReplyPage?: boolean;
}

export function useBotManager({
  productId,
  parentId,
  isNewAutoReplyPage = false,
}: UseBotManagerOptions = {}) {
  const router = useRouter();
  const {
    aiEnabled,
    setAiEnabled,
    autoRepliesEnabled,
    setAutoRepliesEnabled,
    groups,
    replies,
  } = useBotManagerState();

  const [search, setSearch] = useState("");
  const [view, setView] = useState<BotManagerView>(
    isNewAutoReplyPage
      ? "form"
      : parentId
        ? "followups"
        : productId
          ? "questions"
          : "products",
  );

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    productId ?? null,
  );
  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    parentId ?? null,
  );

  const handleSelectedParentDeleted = useCallback(() => {
    setView("questions");
    setSelectedParentId(null);
  }, []);

  const exitNewAutoReply = useCallback(() => {
    router.push("/bot-manager");
  }, [router]);

  const form = useAutoReplyForm({
    selectedProductId,
    setSelectedProductId,
    setSelectedParentId,
    setView,
    onExit: isNewAutoReplyPage ? exitNewAutoReply : undefined,
  });

  const actions = useAutoReplyActions({
    selectedParentId,
    onSelectedParentDeleted: handleSelectedParentDeleted,
  });

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return initialBotProducts.filter(
      (product) =>
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.model.toLowerCase().includes(query),
    );
  }, [search]);

  const productsWithQuestionCounts = useMemo(
    () =>
      filteredProducts.map((product) => ({
        product,
        questionCount: replies.filter((reply) => reply.productId === product.id)
          .length,
      })),
    [filteredProducts, replies],
  );

  const selectedProduct = initialBotProducts.find(
    (product) => product.id === selectedProductId,
  );

  const selectedParent = replies.find((reply) => reply.id === selectedParentId);

  const productGroups = groups.filter(
    (group) => group.productId === selectedProductId,
  );

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

  const followUps = replies.filter(
    (reply) => reply.parentId === selectedParentId,
  );

  const followUpsViewItems = followUps.map((reply) => ({
    reply,
    followUpCount: replies.filter((item) => item.parentId === reply.id).length,
  }));

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

  const selectedParentProductName =
    initialBotProducts.find(
      (product) => product.id === selectedParent?.productId,
    )?.name ?? "Product";

  const openNewAutoReply = useCallback(() => {
    router.push("/bot-manager/new");
  }, [router]);

  const openProduct = useCallback(
    (id: string) => {
      router.push(`/bot-manager/editor?productId=${encodeURIComponent(id)}`);
    },
    [router],
  );

  const backToProducts = useCallback(() => {
    router.push("/bot-manager");
  }, [router]);

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

  const backFromFollowUps = useCallback(() => {
    const parent = replies.find((reply) => reply.id === selectedParentId);
    const currentProductId = parent?.productId ?? selectedProductId;

    if (!currentProductId) {
      router.replace("/bot-manager");
      return;
    }

    if (parent?.parentId) {
      router.replace(
        `/bot-manager/editor/followups?productId=${encodeURIComponent(currentProductId)}&parentId=${encodeURIComponent(parent.parentId)}`,
      );
      return;
    }

    router.replace(
      `/bot-manager/editor?productId=${encodeURIComponent(currentProductId)}`,
    );
  }, [replies, router, selectedParentId, selectedProductId]);

  return {
    view,

    settings: {
      aiEnabled,
      setAiEnabled,
      autoRepliesEnabled,
      setAutoRepliesEnabled,
    },

    products: {
      items: productsWithQuestionCounts,
      search,
      onSearchChange: setSearch,
      onAddAutoReply: openNewAutoReply,
      onSelectProduct: openProduct,
    },

    questions: {
      product: selectedProduct,
      groups: questionsViewGroups,
      maxQuestions: MAX_GROUP_QUESTIONS,
      onBack: backToProducts,
      onAddGroup: () => actions.addGroup(selectedProductId),
      onMoveGroup: actions.moveGroup,
      onAddQuestion: (groupId: string) => {
        if (selectedProduct) {
          form.openForm({ productId: selectedProduct.id, groupId });
        }
      },
      onDeleteGroup: actions.requestDeleteGroup,
      onMoveReply: actions.moveReply,
      onToggleReply: actions.toggleReply,
      onFollowUps: openFollowUps,
      onEditReply: (reply: AutoReply) => form.openForm({ reply }),
      onDeleteReply: actions.requestDeleteReply,
    },

    followUps: {
      parent: selectedParent,
      items: followUpsViewItems,
      productName: selectedParentProductName,
      maxFollowUps: MAX_FOLLOW_UPS,
      onBack: backFromFollowUps,
      onAdd: () => {
        if (selectedParent) {
          form.openForm({
            productId: selectedParent.productId,
            parentId: selectedParent.id,
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
