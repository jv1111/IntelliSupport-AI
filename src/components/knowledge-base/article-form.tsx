"use client";

import { useRef, useState, type FormEvent } from "react";
import { Archive } from "lucide-react";
import type {
  ArticleCategoryTag,
  ArticleScope,
} from "@/generated/prisma/enums";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldLabel, fieldControlStyles } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  articleCategoryLabels,
  articleScopeLabels,
} from "@/components/knowledge-base/data";
import type {
  KnowledgeBaseArticle,
  KnowledgeBaseArticleInput,
} from "@/lib/knowledge-base/types";

interface ArticleFormProps {
  article: KnowledgeBaseArticle | null;
  isSaving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (input: KnowledgeBaseArticleInput) => Promise<boolean>;
  onArchive: () => void;
  onUnarchive: () => void;
  onPublish: () => void;
}

export function ArticleForm({
  article,
  isSaving,
  error,
  onCancel,
  onSave,
  onArchive,
  onUnarchive,
  onPublish,
}: ArticleFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [values, setValues] = useState<KnowledgeBaseArticleInput>(() => ({
    scope: article?.scope ?? "generic",
    categoryTag: article?.categoryTag ?? "troubleshooting",
    title: article?.title ?? "",
    context: article?.context ?? "",
  }));

  function updateField<K extends keyof KnowledgeBaseArticleInput>(
    field: K,
    value: KnowledgeBaseArticleInput[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave(
    status?: KnowledgeBaseArticleInput["status"],
  ): Promise<void> {
    if (!formRef.current?.reportValidity() || isSaving) {
      return;
    }

    await onSave({
      ...values,
      title: values.title.trim(),
      context: values.context.trim(),
      ...(status ? { status } : {}),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSave(article ? undefined : "draft");
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <BackButton
            onClick={onCancel}
            ariaLabel="Back to Knowledge Base"
            disabled={isSaving}
          />

          <div>
            <h1 className="text-base font-bold text-foreground">
              {article ? "Edit KB Article" : "Add New KB Article"}
            </h1>

            <p className="mt-1 text-xs text-muted-foreground">
              Create or update documentation used for AI answer generation.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            fullWidth={false}
            type="button"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>

          {!article ? (
            <>
              <Button
                variant="secondary"
                fullWidth={false}
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Draft"}
              </Button>

              <Button
                variant="primary"
                fullWidth={false}
                type="button"
                onClick={() => void handleSave("published")}
                disabled={isSaving}
              >
                {isSaving ? "Publishing..." : "Publish Article"}
              </Button>
            </>
          ) : (
            <>
              {article.status === "published" && (
                <Button
                  variant="danger-subtle"
                  fullWidth={false}
                  className="gap-1.5"
                  type="button"
                  onClick={onArchive}
                  disabled={isSaving}
                >
                  <Archive className="size-3.5" aria-hidden="true" />
                  Archive
                </Button>
              )}

              <Button
                variant="primary"
                fullWidth={false}
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? "Updating..." : "Update"}
              </Button>

              {article.status === "draft" && (
                <Button
                  variant="primary"
                  fullWidth={false}
                  type="button"
                  onClick={onPublish}
                  disabled={isSaving}
                >
                  Publish Article
                </Button>
              )}

              {article.status === "archived" && (
                <>
                  <Button
                    variant="secondary"
                    fullWidth={false}
                    type="button"
                    onClick={onUnarchive}
                    disabled={isSaving}
                  >
                    Unarchive
                  </Button>

                  <Button
                    variant="primary"
                    fullWidth={false}
                    type="button"
                    onClick={onPublish}
                    disabled={isSaving}
                  >
                    Publish Again
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <Card className="max-w-4xl space-y-6 p-5 sm:p-7">
        <div className="grid grid-cols-1 gap-6 text-xs sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="kb-scope" required>
              Article Scope / Type
            </FieldLabel>

            <select
              id="kb-scope"
              required
              disabled={isSaving}
              value={values.scope}
              onChange={(event) =>
                updateField("scope", event.target.value as ArticleScope)
              }
              className={`${fieldControlStyles} px-3.5 py-2.5 font-semibold`}
            >
              {Object.entries(articleScopeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="kb-category" required>
              Category Tag
            </FieldLabel>

            <select
              id="kb-category"
              required
              disabled={isSaving}
              value={values.categoryTag}
              onChange={(event) =>
                updateField(
                  "categoryTag",
                  event.target.value as ArticleCategoryTag,
                )
              }
              className={`${fieldControlStyles} px-3.5 py-2.5 font-semibold`}
            >
              {Object.entries(articleCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="kb-title" required>
            Article Title
          </FieldLabel>

          <Input
            id="kb-title"
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="e.g. Wi-Fi Router Firmware Reset Guide"
            required
            disabled={isSaving}
            className="bg-surface-muted px-3.5 py-2.5"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="kb-context" required>
            Article Content / AI Context
          </FieldLabel>

          <textarea
            id="kb-context"
            value={values.context}
            onChange={(event) => updateField("context", event.target.value)}
            rows={9}
            required
            disabled={isSaving}
            placeholder="Enter detailed troubleshooting steps, installation instructions, or policy information..."
            className={`${fieldControlStyles} resize-y px-3.5 py-3 leading-relaxed`}
          />

          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Provide clear instructions and relevant details that can be used as
            context when generating support answers.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium text-danger">
            {error}
          </p>
        )}
      </Card>
    </form>
  );
}
