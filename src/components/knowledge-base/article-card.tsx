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

const scopeStyles = {
  generic: "border-indigo-100 bg-indigo-50 text-indigo-700",
  specific: "border-primary/15 bg-primary/5 text-primary",
};

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
    <Card variant="interactive" className="flex h-full flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold ${scopeStyles[article.scope]}`}
        >
          {articleScopeLabels[article.scope]}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-surface-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {articleCategoryLabels[article.categoryTag]}
          </span>

          <StatusBadge status={article.status} />

          {article.status === "archived" && (
            <Button
              variant="danger-subtle"
              fullWidth={false}
              aria-label={`Delete ${article.title}`}
              title="Delete archived article"
              onClick={() => onDelete(article)}
              disabled={isDeleting}
              className="size-8! rounded-full! p-0!"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-primary">
          <FileText className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm leading-relaxed font-bold text-foreground">
            {article.title}
          </h2>

          <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {article.context}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-3">
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
    </Card>
  );
}
