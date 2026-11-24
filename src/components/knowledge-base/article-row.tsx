import Link from "next/link";
import { ArchiveRestore, FileText, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { articleCategoryLabels } from "@/components/knowledge-base/data";
import type { KnowledgeBaseArticle } from "@/lib/knowledge-base/types";

interface ArticleRowProps {
  article: KnowledgeBaseArticle;
  onUnarchive: (article: KnowledgeBaseArticle) => void;
  isUnarchiving: boolean;
  onDelete: (article: KnowledgeBaseArticle) => void;
  isDeleting: boolean;
}

export function ArticleRow({
  article,
  onUnarchive,
  isUnarchiving,
  onDelete,
  isDeleting,
}: ArticleRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <FileText
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-foreground">
          {article.title}
        </p>

        {article.scope === "specific" && (
          <p className="truncate text-[10px] text-muted-foreground">
            {articleCategoryLabels[article.categoryTag]}
          </p>
        )}
      </div>

      <StatusBadge status={article.status} className="shrink-0" />

      {article.status === "archived" && (
        <button
          type="button"
          onClick={() => onDelete(article)}
          disabled={isDeleting}
          aria-label={`Delete ${article.title}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-sm text-[11px] font-bold text-danger hover:text-danger/80 hover:underline disabled:opacity-60"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
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
    </li>
  );
}
