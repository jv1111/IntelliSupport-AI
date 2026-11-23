"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { ArticleForm } from "@/components/knowledge-base/article-form";
import { useKnowledgeBaseEditor } from "@/components/knowledge-base/hooks/use-knowledge-base-editor";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { clearFormDraft } from "@/hooks/use-form-draft";

interface KnowledgeBaseEditorProps {
  articleId?: string;
}

export function KnowledgeBaseEditor({ articleId }: KnowledgeBaseEditorProps) {
  const { bfcacheId } = useRouter();

  return (
    <KnowledgeBaseEditorSession
      key={`${articleId ?? "new-article"}:${bfcacheId}`}
      articleId={articleId}
    />
  );
}

function KnowledgeBaseEditorSession({ articleId }: KnowledgeBaseEditorProps) {
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);

  const {
    article,
    products,
    isLoadingProducts,
    productsError,
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
  } = useKnowledgeBaseEditor(articleId);

  function handleCancel() {
    if (articleId) {
      closeEditor();
      return;
    }

    setIsDiscardOpen(true);
  }

  function handleDiscard() {
    clearFormDraft("knowledge-base");
    setIsDiscardOpen(false);
    closeEditor();
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full p-6">
        <div
          className="flex min-h-64 items-center justify-center text-xs font-medium text-muted-foreground"
          role="status"
        >
          Loading Knowledge Base article...
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto w-full space-y-4 p-6">
        <p role="alert" className="text-xs font-medium text-danger">
          {loadError}
        </p>
        <Button variant="secondary" fullWidth={false} onClick={closeEditor}>
          Back to Knowledge Base
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full p-6">
      <ArticleForm
        key={article?.id ?? "new-article"}
        article={article}
        products={products}
        isLoadingProducts={isLoadingProducts}
        productsError={productsError}
        isSaving={isSaving}
        error={actionError}
        onCancel={handleCancel}
        onSave={saveArticle}
        onArchive={openArchiveConfirmation}
        onUnarchive={unarchiveArticle}
        onPublish={publishArticle}
      />

      <ConfirmationDialog
        open={isDiscardOpen}
        title="Discard article changes?"
        description="Your saved form draft will be permanently cleared. This action cannot be undone."
        confirmLabel="Discard Changes"
        variant="danger"
        onConfirm={handleDiscard}
        onCancel={() => setIsDiscardOpen(false)}
      />

      <ConfirmationDialog
        open={isArchiveOpen}
        title="Archive article?"
        description={`"${article?.title ?? ""}" will be moved to the archived Knowledge Base. You can still restore it later.`}
        confirmLabel="Archive Article"
        pendingLabel="Archiving..."
        variant="danger"
        icon={Archive}
        isPending={isSaving}
        error={actionError}
        onConfirm={archiveArticle}
        onCancel={closeArchiveConfirmation}
      />
    </main>
  );
}
