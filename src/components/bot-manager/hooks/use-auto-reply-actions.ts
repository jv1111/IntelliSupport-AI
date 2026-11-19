"use client";

import { useState } from "react";
import { useBotManagerState } from "@/components/bot-manager/bot-manager-provider";
import type { AutoReply } from "@/components/bot-manager/types";

type PendingDeletion =
  | { type: "group"; id: string; name: string; questionCount: number }
  | { type: "reply"; id: string; question: string; followUpCount: number };

interface UseAutoReplyActionsOptions {
  selectedParentId: string | null;
  onSelectedParentDeleted: () => void;
}

function getReplyTreeIds(replies: AutoReply[], rootId: string) {
  const ids = new Set([rootId]);
  let foundNewChild = true;

  while (foundNewChild) {
    foundNewChild = false;

    replies.forEach((reply) => {
      if (reply.parentId && ids.has(reply.parentId) && !ids.has(reply.id)) {
        ids.add(reply.id);
        foundNewChild = true;
      }
    });
  }

  return ids;
}

function getGroupReplyTreeIds(replies: AutoReply[], groupId: string) {
  const ids = new Set<string>();

  replies
    .filter((reply) => reply.groupId === groupId)
    .forEach((reply) => {
      getReplyTreeIds(replies, reply.id).forEach((id) => ids.add(id));
    });

  return ids;
}

export function useAutoReplyActions({
  selectedParentId,
  onSelectedParentDeleted,
}: UseAutoReplyActionsOptions) {
  const { groups, setGroups, replies, setReplies } = useBotManagerState();

  const [pendingDeletion, setPendingDeletion] =
    useState<PendingDeletion | null>(null);

  function addGroup(productId: string | null) {
    if (!productId) {
      return;
    }

    const productGroupCount = groups.filter(
      (group) => group.productId === productId,
    ).length;

    setGroups((current) => [
      ...current,
      {
        id: `G-${Date.now()}`,
        productId,
        name: `Group ${productGroupCount + 1}`,
      },
    ]);
  }

  function moveReply(id: string, direction: -1 | 1) {
    setReplies((current) => {
      const target = current.find((reply) => reply.id === id);

      if (!target) {
        return current;
      }

      const siblingIndexes = current
        .map((reply, index) => ({ reply, index }))
        .filter(
          ({ reply }) =>
            (reply.parentId ?? null) === (target.parentId ?? null) &&
            (reply.groupId ?? null) === (target.groupId ?? null),
        );

      const position = siblingIndexes.findIndex(({ reply }) => reply.id === id);
      const nextPosition = position + direction;

      if (nextPosition < 0 || nextPosition >= siblingIndexes.length) {
        return current;
      }

      const firstIndex = siblingIndexes[position]?.index;
      const secondIndex = siblingIndexes[nextPosition]?.index;

      if (firstIndex === undefined || secondIndex === undefined) {
        return current;
      }

      const next = [...current];
      [next[firstIndex], next[secondIndex]] = [
        next[secondIndex],
        next[firstIndex],
      ];

      return next;
    });
  }

  function moveGroup(id: string, direction: -1 | 1) {
    setGroups((current) => {
      const target = current.find((group) => group.id === id);

      if (!target) {
        return current;
      }

      const siblingIndexes = current
        .map((group, index) => ({ group, index }))
        .filter(({ group }) => group.productId === target.productId);

      const position = siblingIndexes.findIndex(({ group }) => group.id === id);
      const nextPosition = position + direction;

      if (nextPosition < 0 || nextPosition >= siblingIndexes.length) {
        return current;
      }

      const firstIndex = siblingIndexes[position]?.index;
      const secondIndex = siblingIndexes[nextPosition]?.index;

      if (firstIndex === undefined || secondIndex === undefined) {
        return current;
      }

      const next = [...current];
      [next[firstIndex], next[secondIndex]] = [
        next[secondIndex],
        next[firstIndex],
      ];

      return next;
    });
  }

  function requestDeleteGroup(groupId: string) {
    const group = groups.find((item) => item.id === groupId);

    if (!group) {
      return;
    }

    const removedIds = getGroupReplyTreeIds(replies, groupId);

    setPendingDeletion({
      type: "group",
      id: groupId,
      name: group.name,
      questionCount: removedIds.size,
    });
  }

  function toggleReply(id: string, checked: boolean) {
    setReplies((current) =>
      current.map((reply) =>
        reply.id === id ? { ...reply, active: checked } : reply,
      ),
    );
  }

  function requestDeleteReply(id: string) {
    const reply = replies.find((item) => item.id === id);

    if (!reply) {
      return;
    }

    const removedIds = getReplyTreeIds(replies, id);

    setPendingDeletion({
      type: "reply",
      id,
      question: reply.question,
      followUpCount: removedIds.size - 1,
    });
  }

  function confirmDelete() {
    if (!pendingDeletion) {
      return;
    }

    const removedIds =
      pendingDeletion.type === "group"
        ? getGroupReplyTreeIds(replies, pendingDeletion.id)
        : getReplyTreeIds(replies, pendingDeletion.id);

    if (pendingDeletion.type === "group") {
      setGroups((current) =>
        current.filter((group) => group.id !== pendingDeletion.id),
      );
    }

    setReplies((current) =>
      current.filter((reply) => !removedIds.has(reply.id)),
    );

    if (selectedParentId && removedIds.has(selectedParentId)) {
      onSelectedParentDeleted();
    }

    setPendingDeletion(null);
  }

  const deletionTitle =
    pendingDeletion?.type === "group"
      ? "Delete group?"
      : "Delete automatic reply?";

  const deletionDescription = pendingDeletion
    ? pendingDeletion.type === "group"
      ? `The "${pendingDeletion.name}" group${
          pendingDeletion.questionCount > 0
            ? ` and its ${pendingDeletion.questionCount} question${pendingDeletion.questionCount === 1 ? "" : "s"}`
            : ""
        } will be deleted. This action cannot be undone.`
      : `"${pendingDeletion.question}"${
          pendingDeletion.followUpCount > 0
            ? ` and its ${pendingDeletion.followUpCount} follow-up question${pendingDeletion.followUpCount === 1 ? "" : "s"}`
            : ""
        } will be deleted. This action cannot be undone.`
    : "";

  return {
    pendingDeletion,
    deletionTitle,
    deletionDescription,
    addGroup,
    moveReply,
    moveGroup,
    requestDeleteGroup,
    toggleReply,
    requestDeleteReply,
    confirmDelete,
    cancelDelete: () => setPendingDeletion(null),
  };
}
