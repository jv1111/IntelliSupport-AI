"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import {
  deleteKnowledgeBaseArticle as deleteArticleRequest,
  fetchKnowledgeBaseArticles,
  updateKnowledgeBaseArticle,
} from "@/lib/knowledge-base";
import type {
  KnowledgeBaseArticle,
  KnowledgeBaseArticlePage,
  KnowledgeBaseFilter,
  KnowledgeBaseStatus,
} from "@/lib/knowledge-base/types";

const emptyPage: KnowledgeBaseArticlePage = {
  items: [],
  totalCount: 0,
  totalPages: 0,
  currentPage: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function useKnowledgeBase(initialStatus: KnowledgeBaseStatus) {
  const [status, setStatus] = useState<KnowledgeBaseStatus>(initialStatus);
  const [scope, setScope] = useState<KnowledgeBaseFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [articlePage, setArticlePage] =
    useState<KnowledgeBaseArticlePage>(emptyPage);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [unarchivingArticleId, setUnarchivingArticleId] = useState<
    string | null
  >(null);
  const [articlePendingDeletion, setArticlePendingDeletion] =
    useState<KnowledgeBaseArticle | null>(null);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const requestIdRef = useRef(0);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    requestIdRef.current += 1;
    isLoadingMoreRef.current = false;

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setIsLoadingMore(false);
      setIsLoading(true);
      setFetchError(null);

      try {
        const result = await fetchKnowledgeBaseArticles({
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
          search: search || null,
          scope: scope === "all" ? null : scope,
          categoryTag: null,
          status,
        });

        if (!cancelled) {
          setArticlePage(result);
        }
      } catch (error) {
        if (!cancelled) {
          setFetchError(
            error instanceof Error
              ? error.message
              : "Unable to load Knowledge Base articles. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [search, scope, status, refreshKey]);

  const loadMore = useCallback(async () => {
    if (
      isLoadingMoreRef.current ||
      isLoading ||
      !articlePage.hasNextPage ||
      fetchError
    ) {
      return;
    }

    const requestId = requestIdRef.current;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const result = await fetchKnowledgeBaseArticles({
        page: articlePage.currentPage + 1,
        limit: DEFAULT_PAGE_SIZE,
        search: search || null,
        scope: scope === "all" ? null : scope,
        categoryTag: null,
        status,
      });

      if (requestId === requestIdRef.current) {
        setArticlePage((currentPage) => ({
          ...result,
          items: [...currentPage.items, ...result.items],
        }));
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setFetchError(
          error instanceof Error
            ? error.message
            : "Unable to load more articles. Please try again.",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [
    articlePage.currentPage,
    articlePage.hasNextPage,
    fetchError,
    isLoading,
    scope,
    search,
    status,
  ]);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setScope("all");
  }, []);

  const changeStatus = useCallback((nextStatus: KnowledgeBaseStatus) => {
    setActionError(null);
    setStatus(nextStatus);
  }, []);

  const changeScope = useCallback((nextScope: KnowledgeBaseFilter) => {
    setScope(nextScope);
  }, []);

  const unarchiveArticle = useCallback(
    async (articleId: string) => {
      if (unarchivingArticleId) {
        return;
      }

      setUnarchivingArticleId(articleId);
      setActionError(null);

      try {
        await updateKnowledgeBaseArticle(articleId, { status: "draft" });
        setRefreshKey((current) => current + 1);
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to unarchive article. Please try again.",
        );
      } finally {
        setUnarchivingArticleId(null);
      }
    },
    [unarchivingArticleId],
  );

  const openDeleteConfirmation = useCallback(
    (article: KnowledgeBaseArticle) => {
      if (article.status !== "archived") {
        return;
      }

      setActionError(null);
      setArticlePendingDeletion(article);
    },
    [],
  );

  const closeDeleteConfirmation = useCallback(() => {
    if (deletingArticleId) {
      return;
    }

    setArticlePendingDeletion(null);
    setActionError(null);
  }, [deletingArticleId]);

  const confirmDeleteArticle = useCallback(async () => {
    if (
      !articlePendingDeletion ||
      articlePendingDeletion.status !== "archived" ||
      deletingArticleId
    ) {
      return;
    }

    setDeletingArticleId(articlePendingDeletion.id);
    setActionError(null);

    try {
      await deleteArticleRequest(articlePendingDeletion.id);
      setArticlePendingDeletion(null);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to delete article. Please try again.",
      );
    } finally {
      setDeletingArticleId(null);
    }
  }, [articlePendingDeletion, deletingArticleId]);

  const retry = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return {
    articles: articlePage.items,
    totalCount: articlePage.totalCount,
    hasNextPage: articlePage.hasNextPage,
    searchInput,
    setSearchInput,
    status,
    changeStatus,
    scope,
    changeScope,
    isLoading,
    isLoadingMore,
    fetchError,
    actionError,
    unarchivingArticleId,
    articlePendingDeletion,
    deletingArticleId,
    loadMore,
    clearFilters,
    unarchiveArticle,
    openDeleteConfirmation,
    closeDeleteConfirmation,
    confirmDeleteArticle,
    retry,
  };
}
