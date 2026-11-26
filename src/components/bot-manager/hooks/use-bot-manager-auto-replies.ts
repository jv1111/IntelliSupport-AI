"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAutoReply as createAutoReplyRequest,
  deleteAutoReply as deleteAutoReplyRequest,
  fetchAutoReplies,
  moveAutoReply as moveAutoReplyRequest,
  updateAutoReply as updateAutoReplyRequest,
} from "@/lib/auto-replies";
import type {
  AutoReply,
  AutoReplyMoveDirection,
  CreateAutoReplyInput,
} from "@/lib/auto-replies/types";

export function useBotManagerAutoReplies(productId?: string, enabled = true) {
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function loadAutoReplies() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchAutoReplies(productId);

        if (!cancelled) {
          setAutoReplies(result);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load automatic replies. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAutoReplies();

    return () => {
      cancelled = true;
    };
  }, [enabled, productId, refreshKey]);

  const saveAutoReply = useCallback(
    async (
      input: CreateAutoReplyInput,
      autoReplyId?: string,
    ): Promise<AutoReply | null> => {
      setIsSaving(true);
      setActionError(null);

      try {
        const savedAutoReply = autoReplyId
          ? await updateAutoReplyRequest(autoReplyId, {
              message: input.message,
              answer: input.answer,
            })
          : await createAutoReplyRequest(input);

        setAutoReplies((current) =>
          autoReplyId
            ? current.map((item) =>
                item.id === savedAutoReply.id ? savedAutoReply : item,
              )
            : [...current, savedAutoReply].sort(
                (a, b) => a.position - b.position,
              ),
        );

        return savedAutoReply;
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to save automatic reply. Please try again.",
        );

        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const addAutoReply = useCallback(
    (input: CreateAutoReplyInput) => saveAutoReply(input),
    [saveAutoReply],
  );

  const deleteAutoReply = useCallback(
    async (autoReplyId: string): Promise<boolean> => {
      setIsDeleting(true);
      setDeletionError(null);

      try {
        await deleteAutoReplyRequest(autoReplyId);

        setAutoReplies((current) => {
          const deletedIds = new Set([autoReplyId]);
          let hasDescendants = true;

          while (hasDescendants) {
            hasDescendants = false;

            for (const item of current) {
              if (
                item.parentId &&
                deletedIds.has(item.parentId) &&
                !deletedIds.has(item.id)
              ) {
                deletedIds.add(item.id);
                hasDescendants = true;
              }
            }
          }

          return current.filter((item) => !deletedIds.has(item.id));
        });

        return true;
      } catch (error) {
        setDeletionError(
          error instanceof Error
            ? error.message
            : "Unable to delete automatic reply. Please try again.",
        );

        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [],
  );

  const moveAutoReply = useCallback(
    async (
      autoReplyId: string,
      direction: AutoReplyMoveDirection,
    ): Promise<boolean> => {
      const target = autoReplies.find((item) => item.id === autoReplyId);

      if (!target) {
        return false;
      }

      const siblings = autoReplies
        .filter(
          (item) =>
            item.productId === target.productId &&
            item.parentId === target.parentId,
        )
        .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));

      const currentIndex = siblings.findIndex(
        (item) => item.id === autoReplyId,
      );
      const nextIndex = currentIndex + (direction === "UP" ? -1 : 1);

      if (currentIndex < 0) {
        return false;
      }

      if (nextIndex < 0 || nextIndex >= siblings.length) {
        return true;
      }

      setIsReordering(true);
      setReorderError(null);

      try {
        const movedReply = await moveAutoReplyRequest(autoReplyId, direction);

        setAutoReplies((current) => {
          const currentSiblings = current
            .filter(
              (item) =>
                item.productId === movedReply.productId &&
                item.parentId === movedReply.parentId,
            )
            .sort(
              (a, b) => a.position - b.position || a.id.localeCompare(b.id),
            );

          const reordered = currentSiblings.filter(
            (item) => item.id !== movedReply.id,
          );

          const insertIndex = Math.max(
            0,
            Math.min(movedReply.position, reordered.length),
          );

          reordered.splice(insertIndex, 0, movedReply);

          const positions = new Map(
            reordered.map((item, index) => [item.id, index]),
          );

          return current.map((item) => {
            const position = positions.get(item.id);

            return position === undefined ? item : { ...item, position };
          });
        });

        return true;
      } catch (error) {
        setReorderError(
          error instanceof Error
            ? error.message
            : "Unable to reorder messages. Please try again.",
        );

        return false;
      } finally {
        setIsReordering(false);
      }
    },
    [autoReplies],
  );

  const retry = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return {
    autoReplies,
    isLoading,
    error,
    isSaving,
    isDeleting,
    isReordering,
    actionError,
    deletionError,
    reorderError,
    addAutoReply,
    saveAutoReply,
    deleteAutoReply,
    moveAutoReply,
    retry,
  };
}
