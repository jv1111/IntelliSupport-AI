"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createKnowledgeBaseArticle,
  fetchKnowledgeBaseArticle,
  updateKnowledgeBaseArticle,
} from "@/lib/knowledge-base";
import type {
  KnowledgeBaseArticle,
  KnowledgeBaseArticleInput,
  KnowledgeBaseStatus,
} from "@/lib/knowledge-base/types";

export function useKnowledgeBaseEditor(articleId?: string) {
  const router = useRouter();

  const [article, setArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(articleId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  useEffect(() => {
    if (!articleId) {
      return;
    }

    let cancelled = false;

    fetchKnowledgeBaseArticle(articleId)
      .then((result) => {
        if (!cancelled) {
          setArticle(result);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load Knowledge Base article. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const closeEditor = useCallback(() => {
    router.push("/knowledge-base");
  }, [router]);

  const saveArticle = useCallback(
    async (input: KnowledgeBaseArticleInput): Promise<boolean> => {
      setIsSaving(true);
      setActionError(null);

      try {
        const savedArticle = article
          ? await updateKnowledgeBaseArticle(article.id, input)
          : await createKnowledgeBaseArticle(input);

        router.replace(`/knowledge-base?status=${savedArticle.status}`);
        return true;
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to save the article. Please try again.",
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [article, router],
  );

  const openArchiveConfirmation = useCallback(() => {
    if (article?.status !== "published") {
      return;
    }

    setActionError(null);
    setIsArchiveOpen(true);
  }, [article]);

  const closeArchiveConfirmation = useCallback(() => {
    if (isSaving) {
      return;
    }

    setIsArchiveOpen(false);
    setActionError(null);
  }, [isSaving]);

  const changeArticleStatus = useCallback(
    async (status: KnowledgeBaseStatus): Promise<void> => {
      if (!article || isSaving) {
        return;
      }

      setIsSaving(true);
      setActionError(null);

      try {
        await updateKnowledgeBaseArticle(article.id, {
          title: article.title,
          scope: article.scope,
          categoryTag: article.categoryTag,
          context: article.context,
          status,
        });

        if (status === "archived") {
          setIsArchiveOpen(false);
        }

        router.replace(`/knowledge-base?status=${status}`);
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to update article status. Please try again.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [article, isSaving, router],
  );

  const archiveArticle = useCallback(async () => {
    await changeArticleStatus("archived");
  }, [changeArticleStatus]);

  const unarchiveArticle = useCallback(() => {
    void changeArticleStatus("draft");
  }, [changeArticleStatus]);

  const publishArticle = useCallback(() => {
    void changeArticleStatus("published");
  }, [changeArticleStatus]);

  return {
    article,
    isLoading,
    loadError,
    isSaving,
    actionError,
    isArchiveOpen,
    closeEditor,
    saveArticle,
    openArchiveConfirmation,
    closeArchiveConfirmation,
    archiveArticle,
    unarchiveArticle,
    publishArticle,
  };
}
