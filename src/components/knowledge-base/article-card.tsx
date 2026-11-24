import Link from "next/link";
import { ArchiveRestore, FileText, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  articleCategoryLabels,
  articleScopeLabels,
} from "@/components/knowledge-base/data";
import type { KnowledgeBaseArticle } from "@/lib/knowledge-base/types";

interface ArticleCardProps {
  article: KnowledgeBaseArticle;
  onUnarchive: (article: KnowledgeBaseArticle) => void;
  isUnarchiving: boolean;
  onDelete: (article: KnowledgeBaseArticle) => void;
  isDeleting: boolean;
}

export function ArticleCard({
  article,
  onUnarchive,
  isUnarchiving,
  onDelete,
  isDeleting,
}: ArticleCardProps) {
  return (
    <article className="h-full">
      <Card variant="interactive" className="flex h-full flex-col">
        <div className="flex flex-1 flex-col justify-between gap-4 p-5">
          <div>
            <div className="flex items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-primary inset-ring-1 inset-ring-border">
                <FileText className="size-6 stroke-[1.5]" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="mb-1 truncate text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  {articleScopeLabels[article.scope]} ·{" "}
                  {articleCategoryLabels[article.categoryTag]}
                </p>

                <h2 className="line-clamp-2 text-sm font-bold text-foreground">
                  {article.title}
                </h2>
              </div>

              <StatusBadge status={article.status} className="shrink-0" />
            </div>

            <p className="mt-2 line-clamp-3 min-h-15 text-xs leading-relaxed text-muted-foreground">
              {article.context}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
            <span className="mr-auto min-w-0 truncate font-mono text-[10px] text-muted-foreground">
              {article.id}
            </span>

            {article.status === "archived" && (
              <Button
                variant="danger-subtle"
                fullWidth={false}
                aria-label={`Delete ${article.title}`}
                title="Delete archived article"
                onClick={() => onDelete(article)}
                disabled={isDeleting}
                className="size-9! rounded-full! p-0! shadow-sm"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            )}

            {article.status === "archived" ? (
              <button
                type="button"
                onClick={() => onUnarchive(article)}
                disabled={isUnarchiving}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-sm text-[11px] font-bold text-primary hover:text-primary-hover hover:underline disabled:opacity-60"
              >
                <ArchiveRestore className="size-3.5" aria-hidden="true" />
                {isUnarchiving ? "Unarchiving..." : "Unarchive"}
              </button>
            ) : (
              <Link
                href={`/knowledge-base/${article.id}/edit`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-sm text-[11px] font-bold text-primary hover:text-primary-hover hover:underline"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit Article
              </Link>
            )}
          </div>
        </div>
      </Card>
    </article>
  );
}
