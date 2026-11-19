"use client";

import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { useBotManagerState } from "@/components/bot-manager/bot-manager-provider";
import {
  MAX_FOLLOW_UPS,
  MAX_GROUP_QUESTIONS,
} from "@/components/bot-manager/constants";
import type {
  AutoReply,
  AutoReplyFormValues,
  AutoReplyGroup,
  BotManagerView,
} from "@/components/bot-manager/types";

interface UseAutoReplyFormOptions {
  selectedProductId: string | null;
  setSelectedProductId: Dispatch<SetStateAction<string | null>>;
  setSelectedParentId: Dispatch<SetStateAction<string | null>>;
  setView: Dispatch<SetStateAction<BotManagerView>>;
  onExit?: () => void;
}

interface OpenAutoReplyFormOptions {
  reply?: AutoReply;
  productId?: string;
  groupId?: string;
  parentId?: string;
}

const initialFormValues: AutoReplyFormValues = {
  productId: "",
  groupId: "",
  question: "",
  answer: "",
  newGroupName: "",
};

export function useAutoReplyForm({
  selectedProductId,
  setSelectedProductId,
  setSelectedParentId,
  setView,
  onExit,
}: UseAutoReplyFormOptions) {
  const { groups, setGroups, replies, setReplies } = useBotManagerState();

  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [formParentId, setFormParentId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [formValues, setFormValues] =
    useState<AutoReplyFormValues>(initialFormValues);

  const formGroups = groups.filter(
    (group) => group.productId === formValues.productId,
  );

  function openForm(options: OpenAutoReplyFormOptions = {}) {
    const reply = options.reply;
    const productId =
      reply?.productId ?? options.productId ?? selectedProductId ?? "";

    const parentId = reply?.parentId ?? options.parentId ?? null;
    const availableGroups = groups.filter(
      (group) => group.productId === productId,
    );

    const groupId = parentId
      ? ""
      : (reply?.groupId ??
        options.groupId ??
        (productId ? (availableGroups[0]?.id ?? "NEW") : ""));

    setEditingReplyId(reply?.id ?? null);
    setFormParentId(parentId);
    setFormError("");
    setFormValues({
      productId,
      groupId,
      question: reply?.question ?? "",
      answer: reply?.answer ?? "",
      newGroupName: "",
    });
    setView("form");
  }

  function closeForm() {
    setFormError("");

    if (onExit) {
      onExit();
      return;
    }

    if (formParentId) {
      setSelectedParentId(formParentId);
      setView("followups");
      return;
    }

    if (formValues.productId || selectedProductId) {
      if (formValues.productId) {
        setSelectedProductId(formValues.productId);
      }
      setView("questions");
      return;
    }

    setView("products");
  }

  function updateFormValue(field: keyof AutoReplyFormValues, value: string) {
    if (field === "productId") {
      const availableGroups = groups.filter(
        (group) => group.productId === value,
      );

      setFormValues((current) => ({
        ...current,
        productId: value,
        groupId: availableGroups[0]?.id ?? "NEW",
        newGroupName: "",
      }));
      return;
    }

    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const productId = formValues.productId;
    const question = formValues.question.trim();
    const answer = formValues.answer.trim();

    if (!productId) {
      setFormError("Please select a product.");
      return;
    }

    if (!question || !answer) {
      setFormError("Please enter both a question and an answer.");
      return;
    }

    let groupId = formValues.groupId;

    if (!formParentId && groupId === "NEW") {
      const productGroupCount = groups.filter(
        (group) => group.productId === productId,
      ).length;

      const newGroup: AutoReplyGroup = {
        id: `G-${Date.now()}`,
        productId,
        name:
          formValues.newGroupName.trim() || `Group ${productGroupCount + 1}`,
      };

      setGroups((current) => [...current, newGroup]);
      groupId = newGroup.id;
    }

    if (!formParentId && !groupId) {
      setFormError("Please select a group.");
      return;
    }

    if (!formParentId) {
      const currentGroupReplies = replies.filter(
        (reply) => reply.groupId === groupId,
      );

      if (
        !editingReplyId &&
        currentGroupReplies.length >= MAX_GROUP_QUESTIONS
      ) {
        setFormError("A group can contain up to 3 questions.");
        return;
      }
    }

    if (formParentId) {
      const currentFollowUps = replies.filter(
        (reply) => reply.parentId === formParentId,
      );

      if (!editingReplyId && currentFollowUps.length >= MAX_FOLLOW_UPS) {
        setFormError("A question can have up to 3 follow-ups.");
        return;
      }
    }

    const existingReply = replies.find((reply) => reply.id === editingReplyId);

    const nextReply: AutoReply = {
      id: editingReplyId ?? `AR-${Date.now()}`,
      productId,
      question,
      answer,
      active: existingReply?.active ?? true,
      ...(formParentId ? { parentId: formParentId } : { groupId }),
    };

    setReplies((current) =>
      editingReplyId
        ? current.map((reply) =>
            reply.id === editingReplyId ? nextReply : reply,
          )
        : [...current, nextReply],
    );

    setSelectedProductId(productId);
    setFormError("");

    if (onExit) {
      onExit();
      return;
    }

    if (formParentId) {
      setSelectedParentId(formParentId);
      setView("followups");
    } else {
      setView("questions");
    }
  }

  return {
    editingReplyId,
    formParentId,
    formError,
    formValues,
    formGroups,
    openForm,
    closeForm,
    updateFormValue,
    saveReply,
  };
}
