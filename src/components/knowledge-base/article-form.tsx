"use client";

import { useMemo, useRef, type FormEvent } from "react";
import { Archive, LockKeyhole } from "lucide-react";
import type {
  ArticleCategoryTag,
  ArticleScope,
} from "@/generated/prisma/enums";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldLabel, fieldControlStyles } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useFormDraft } from "@/hooks/use-form-draft";
import { SelectField } from "@/components/ui/select-field";
import {
  articleCategoryLabels,
  articleScopeLabels,
  genericArticleCategoryLabel,
} from "@/components/knowledge-base/data";
import type { Product } from "@/lib/products/types";
import type {
  KnowledgeBaseArticle,
  KnowledgeBaseArticleInput,
} from "@/lib/knowledge-base/types";

interface ArticleFormProps {
  article: KnowledgeBaseArticle | null;
  products: Product[];
  isLoadingProducts: boolean;
  productsError: string | null;
  isSaving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (input: KnowledgeBaseArticleInput) => Promise<boolean>;
  onArchive: () => void;
  onUnarchive: () => void;
  onPublish: () => void;
}

type ArticleFormValues = Pick<
  KnowledgeBaseArticleInput,
  "scope" | "categoryTag" | "title" | "context"
> & {
  productId: string;
};

function getInitialValues(
  article: KnowledgeBaseArticle | null,
): ArticleFormValues {
  return {
    scope: article?.scope ?? "generic",
    categoryTag: article?.categoryTag ?? "troubleshooting",
    title: article?.title ?? "",
    context: article?.context ?? "",
    productId: article?.productId ?? "",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function restoreArticleFormValues(
  value: unknown,
  initialValues: ArticleFormValues,
): ArticleFormValues {
  if (!isRecord(value)) {
    return initialValues;
  }

  return {
    scope:
      typeof value.scope === "string" &&
      Object.prototype.hasOwnProperty.call(articleScopeLabels, value.scope)
        ? (value.scope as ArticleScope)
        : initialValues.scope,
    categoryTag:
      typeof value.categoryTag === "string" &&
      Object.prototype.hasOwnProperty.call(
        articleCategoryLabels,
        value.categoryTag,
      )
        ? (value.categoryTag as ArticleCategoryTag)
        : initialValues.categoryTag,
    title: typeof value.title === "string" ? value.title : initialValues.title,
    context:
      typeof value.context === "string" ? value.context : initialValues.context,
    productId:
      typeof value.productId === "string"
        ? value.productId
        : typeof value.selectedItemId === "string"
          ? value.selectedItemId
          : initialValues.productId,
  };
}

export function ArticleForm({
  article,
  products,
  isLoadingProducts,
  productsError,
  isSaving,
  error,
  onCancel,
  onSave,
  onArchive,
  onUnarchive,
  onPublish,
}: ArticleFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const initialValues = useMemo(() => getInitialValues(article), [article]);

  const { values, saveDraft, clearDraft } = useFormDraft({
    formId: "knowledge-base",
    entityId: article?.id,
    initialValues,
    deserialize: restoreArticleFormValues,
  });

  function updateField<K extends keyof ArticleFormValues>(
    field: K,
    value: ArticleFormValues[K],
  ) {
    saveDraft({
      ...values,
      [field]: value,
    });
  }

  async function handleSave(
    status?: KnowledgeBaseArticleInput["status"],
  ): Promise<void> {
    if (!formRef.current?.reportValidity() || isSaving) {
      return;
    }

    const saved = await onSave({
      scope: values.scope,
      categoryTag: values.categoryTag,
      title: values.title.trim(),
      context: values.context.trim(),
      ...(values.scope === "specific" && values.productId
        ? { productId: values.productId }
        : {}),
      ...(status ? { status } : {}),
    });

    if (saved) {
      clearDraft();
    }
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
            <SelectField
              id="kb-scope"
              required
              disabled={isSaving}
              value={values.scope}
              onChange={(event) =>
                updateField("scope", event.target.value as ArticleScope)
              }
              options={Object.entries(articleScopeLabels).map(
                ([value, label]) => ({ value, label }),
              )}
            />
          </div>

          <div>
            <FieldLabel htmlFor="kb-category" required>
              Category Tag
            </FieldLabel>
            {values.scope === "generic" ? (
              <div className="relative">
                <input
                  id="kb-category"
                  type="text"
                  value={genericArticleCategoryLabel}
                  disabled
                  readOnly
                  className={`${fieldControlStyles} cursor-not-allowed bg-surface-muted px-3.5 py-2.5`}
                />
                <LockKeyhole
                  className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            ) : (
              <SelectField
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
                options={Object.entries(articleCategoryLabels).map(
                  ([value, label]) => ({ value, label }),
                )}
              />
            )}
          </div>

          {values.scope !== "generic" && (
            <div>
              <FieldLabel htmlFor="kb-related-product" required>
                Related Product
              </FieldLabel>

              <SelectField
                id="kb-related-product"
                required
                disabled={
                  isSaving || isLoadingProducts || products.length === 0
                }
                value={values.productId}
                onChange={(event) =>
                  updateField("productId", event.target.value)
                }
                options={[
                  {
                    value: "",
                    label: isLoadingProducts
                      ? "Loading products..."
                      : products.length > 0
                        ? "Select a product..."
                        : productsError
                          ? "Unable to load products"
                          : "No available products",
                  },
                  ...products.map((product) => ({
                    value: product.id,
                    label: product.name,
                  })),
                ]}
              />

              <p
                className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground"
                role={productsError ? "alert" : undefined}
              >
                {productsError
                  ? productsError
                  : isLoadingProducts
                    ? "Loading products..."
                    : products.length === 0
                      ? "No published or archived products are available."
                      : "The selected product will be linked when you save the article."}
              </p>
            </div>
          )}
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
            className="bg-surface-muted"
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
