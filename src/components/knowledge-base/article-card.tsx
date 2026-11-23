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
  onUnarchive: (articleId: string) => void;
  isUnarchiving: boolean;
  onDelete: (article: KnowledgeBaseArticle) => void;
  isDeleting: boolean;
}

function formatUpdatedDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
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
        <div className="relative aspect-4/3 shrink-0 overflow-hidden bg-linear-to-br from-primary/10 via-surface-muted to-secondary/10">
          <div
            className="absolute -top-8 -left-8 size-28 rounded-full bg-primary/15 blur-2xl"
            aria-hidden="true"
          />

          <div
            className="absolute -right-8 -bottom-8 size-28 rounded-full bg-secondary/15 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative flex h-full flex-col items-center justify-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-surface text-primary shadow-sm inset-ring-1 inset-ring-border transition-transform duration-300 group-hover:scale-110">
              <FileText className="size-7 stroke-[1.5]" aria-hidden="true" />
            </div>

            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Knowledge Article
            </span>
          </div>

          <StatusBadge
            status={article.status}
            className="absolute top-3 right-3"
          />

          {article.status === "archived" && (
            <Button
              variant="danger-subtle"
              fullWidth={false}
              aria-label={`Delete ${article.title}`}
              title="Delete archived article"
              onClick={() => onDelete(article)}
              disabled={isDeleting}
              className="absolute top-3 left-3 z-10 size-9! rounded-full! p-0! shadow-sm"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4 p-5">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {articleScopeLabels[article.scope]} · {articleCategoryLabels[article.categoryTag]}
            </p>

            <h2 className="text-sm font-bold text-foreground">
              {article.title}
            </h2>

            <p className="mt-2 line-clamp-3 min-h-15 text-xs leading-relaxed text-muted-foreground">
              {article.context}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-[10px] text-muted-foreground">
                {article.id}
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                Updated {formatUpdatedDate(article.updatedAt)}
              </p>
            </div>

            {article.status === "archived" ? (
              <button
                type="button"
                onClick={() => onUnarchive(article.id)}
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
