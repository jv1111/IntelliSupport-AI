"use client";

import { useRef } from "react";
import { BookOpen, Trash2 } from "lucide-react";
import { ArticleCard } from "@/components/knowledge-base/article-card";
import { ArticleScopeFilter } from "@/components/knowledge-base/article-scope-filter";
import { useKnowledgeBase } from "@/components/knowledge-base/hooks/use-knowledge-base";
import { knowledgeBaseStatusLabels } from "@/components/knowledge-base/data";
import type { KnowledgeBaseStatus } from "@/lib/knowledge-base/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { PrimaryActionLink } from "@/components/ui/primary-action-link";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

interface KnowledgeBaseProps {
  initialStatus: KnowledgeBaseStatus;
}

const statusTabs: { label: string; value: KnowledgeBaseStatus }[] = [
  { label: knowledgeBaseStatusLabels.published, value: "published" },
  { label: knowledgeBaseStatusLabels.draft, value: "draft" },
  { label: knowledgeBaseStatusLabels.archived, value: "archived" },
];

export function KnowledgeBase({ initialStatus }: KnowledgeBaseProps) {
  const {
    articles,
    totalCount,
    hasNextPage,
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
  } = useKnowledgeBase(initialStatus);

  const articleScrollRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters = Boolean(searchInput.trim()) || scope !== "all";

  useInfiniteScroll({
    rootRef: articleScrollRef,
    targetRef: loadMoreRef,
    enabled: hasNextPage && !isLoading && !isLoadingMore && !fetchError,
    onLoadMore: loadMore,
  });

  return (
    <main className="mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden p-6">
      <section className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-foreground">
              Knowledge Base & AI Resources
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Curate general policies, installation guides, and troubleshooting
              instructions used as context for AI-generated answers.
            </p>
          </div>

          <PrimaryActionLink href="/knowledge-base/new">
            Add KB Article
          </PrimaryActionLink>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border pb-3">
          {statusTabs.map((tab) => {
            const isActive = status === tab.value;

            return (
              <Button
                key={tab.value}
                variant="tab"
                active={isActive}
                aria-pressed={isActive}
                onClick={() => changeStatus(tab.value)}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
          <div className="w-full max-w-md">
            <SearchInput
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search article titles..."
              aria-label="Search Knowledge Base articles"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <ArticleScopeFilter value={scope} onChange={changeScope} />

            <p className="text-xs text-muted-foreground">
              {totalCount} {totalCount === 1 ? "article" : "articles"}
            </p>
          </div>
        </div>

        {(fetchError || (actionError && !articlePendingDeletion)) && (
          <div
            role="alert"
            className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 text-xs text-danger"
          >
            <span>{fetchError ?? actionError}</span>

            {fetchError && (
              <Button
                variant="text"
                fullWidth={false}
                onClick={retry}
                className="text-danger hover:text-danger"
              >
                Try again
              </Button>
            )}
          </div>
        )}

        {isLoading ? (
          <div
            className="flex min-h-64 flex-1 items-center justify-center text-xs font-medium text-muted-foreground"
            role="status"
          >
            Loading Knowledge Base articles...
          </div>
        ) : articles.length > 0 ? (
          <div
            ref={articleScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onUnarchive={unarchiveArticle}
                  isUnarchiving={unarchivingArticleId === article.id}
                  onDelete={openDeleteConfirmation}
                  isDeleting={deletingArticleId === article.id}
                />
              ))}
            </div>

            {hasNextPage && (
              <div
                ref={loadMoreRef}
                className="flex min-h-16 items-center justify-center py-4"
              >
                {isLoadingMore && (
                  <p
                    className="text-xs font-medium text-muted-foreground"
                    role="status"
                  >
                    Loading more articles...
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <Card className="flex min-h-72 flex-1 flex-col items-center justify-center border-dashed px-6 py-12 text-center shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground">
              <BookOpen className="size-6" aria-hidden="true" />
            </div>

            <h2 className="mt-4 text-sm font-bold text-foreground">
              {hasActiveFilters
                ? "No articles found"
                : "Your Knowledge Base is empty"}
            </h2>

            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {hasActiveFilters
                ? "Try another search term or select a different article scope."
                : "Create your first article to start building your AI support resources."}
            </p>

            {hasActiveFilters ? (
              <Button
                variant="text"
                fullWidth={false}
                onClick={clearFilters}
                className="mt-3 px-2 py-2"
              >
                Clear Filters
              </Button>
            ) : (
              <PrimaryActionLink
                href="/knowledge-base/new"
                className="mt-4 px-4"
              >
                Add KB Article
              </PrimaryActionLink>
            )}
          </Card>
        )}
      </section>

      <ConfirmationDialog
        open={Boolean(articlePendingDeletion)}
        title="Delete archived article?"
        description={`"${articlePendingDeletion?.title ?? ""}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete Article"
        pendingLabel="Deleting..."
        variant="danger"
        icon={Trash2}
        isPending={Boolean(deletingArticleId)}
        error={articlePendingDeletion ? actionError : null}
        onConfirm={confirmDeleteArticle}
        onCancel={closeDeleteConfirmation}
      />
    </main>
  );
}
