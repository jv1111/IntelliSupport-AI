"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ArticleRow } from "@/components/knowledge-base/article-row";
import type { ArticleGroup } from "@/components/knowledge-base/group-articles";
import type { KnowledgeBaseArticle } from "@/lib/knowledge-base/types";

interface ArticleGroupListProps {
  groups: ArticleGroup[];
  onUnarchive: (article: KnowledgeBaseArticle) => void;
  unarchivingArticleId: string | null;
  onDelete: (article: KnowledgeBaseArticle) => void;
  deletingArticleId: string | null;
}

export function ArticleGroupList({
  groups,
  onUnarchive,
  unarchivingArticleId,
  onDelete,
  deletingArticleId,
}: ArticleGroupListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  function toggleGroup(groupId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }

      return next;
    });
  }

  return (
    <div className="divide-y divide-border">
      {groups.map((group) => {
        const isExpanded = expandedIds.has(group.id);
        const panelId = `kb-group-${group.id}`;

        return (
          <section key={group.id}>
            <h2>
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={panelId}
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:outline-none"
              >
                <span className="min-w-0 truncate text-sm font-bold text-foreground">
                  {group.label}
                </span>

                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    {group.articles.length}{" "}
                    {group.articles.length === 1 ? "article" : "articles"}
                  </span>

                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </span>
              </button>
            </h2>

            <div
              id={panelId}
              hidden={!isExpanded}
              className="border-t border-border"
            >
              <ul className="ml-6 divide-y divide-border/70">
                {group.articles.map((article) => (
                  <ArticleRow
                    key={article.id}
                    article={article}
                    onUnarchive={onUnarchive}
                    isUnarchiving={unarchivingArticleId === article.id}
                    onDelete={onDelete}
                    isDeleting={deletingArticleId === article.id}
                  />
                ))}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
