"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAutoReply as createAutoReplyRequest,
  deleteAutoReply as deleteAutoReplyRequest,
  fetchAutoReplies,
  updateAutoReply as updateAutoReplyRequest,
} from "@/lib/auto-replies";
import type { AutoReply, CreateAutoReplyInput } from "@/lib/auto-replies/types";

export function useBotManagerAutoReplies(productId?: string, enabled = true) {
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletionError, setDeletionError] = useState<string | null>(null);
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
              question: input.question,
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

  const retry = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return {
    autoReplies,
    isLoading,
    error,
    isSaving,
    isDeleting,
    actionError,
    deletionError,
    addAutoReply,
    saveAutoReply,
    deleteAutoReply,
    retry,
  };
}
