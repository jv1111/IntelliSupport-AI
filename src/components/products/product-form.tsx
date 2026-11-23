"use client";

import { useMemo, useRef, useState } from "react";
import { Archive } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldLabel, fieldControlStyles } from "@/components/ui/field";
import { useFormDraft } from "@/hooks/use-form-draft";
import { PRODUCT_FIELD_LIMITS } from "@/lib/products/constants";
import { ProductImagePicker } from "@/components/products/product-image-picker";
import type {
  Product,
  ProductInput,
  ProductStatus,
} from "@/lib/products/types";

interface ProductFormProps {
  product: Product | null;
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (
    input: ProductInput,
    imageFile: File | null,
    removeImage: boolean,
  ) => Promise<boolean>;
  onArchive: () => void;
  onUnarchive: () => void;
  onPublish: () => void;
}

interface ProductFormValues {
  name: string;
  sku: string;
  description: string;
}

function getInitialValues(product: Product | null): ProductFormValues {
  return {
    name: product?.name ?? "",
    sku: product?.sku === "Not specified" ? "" : (product?.sku ?? ""),
    description: product?.description ?? "",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function restoreProductFormValues(
  value: unknown,
  initialValues: ProductFormValues,
): ProductFormValues {
  if (!isRecord(value)) {
    return initialValues;
  }

  return {
    name: typeof value.name === "string" ? value.name : initialValues.name,
    sku: typeof value.sku === "string" ? value.sku : initialValues.sku,
    description:
      typeof value.description === "string"
        ? value.description
        : initialValues.description,
  };
}

export function ProductForm({
  product,
  isPending,
  error,
  onCancel,
  onSave,
  onArchive,
  onUnarchive,
  onPublish,
}: ProductFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [removeProductImage, setRemoveProductImage] = useState(false);

  const initialValues = useMemo(() => getInitialValues(product), [product]);

  const { values, saveDraft, clearDraft } = useFormDraft({
    formId: "product",
    entityId: product?.id,
    initialValues,
    deserialize: restoreProductFormValues,
  });

  function updateField<K extends keyof ProductFormValues>(
    field: K,
    value: ProductFormValues[K],
  ) {
    saveDraft({
      ...values,
      [field]: value,
    });
  }

  function handleImageChange(file: File | null, removeImage: boolean) {
    setSelectedImageFile(file);
    setRemoveProductImage(removeImage);
  }

  async function handleSave(nextStatus?: ProductStatus) {
    const form = formRef.current;

    if (!form?.reportValidity()) {
      return;
    }

    const input: ProductInput = {
      name: values.name.trim(),
      sku: values.sku.trim() || undefined,
      description: values.description.trim(),
    };

    if (nextStatus) {
      input.status = nextStatus;
    }

    const saved = await onSave(input, selectedImageFile, removeProductImage);

    if (saved) {
      clearDraft();
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSave(product ? undefined : "draft");
  }

  return (
    <section className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <BackButton onClick={onCancel} ariaLabel="Back to products" />

          <div>
            <h1 className="text-base font-bold text-foreground">
              {product ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage product specifications and catalog information.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            fullWidth={false}
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>

          {!product ? (
            <>
              <Button
                variant="secondary"
                fullWidth={false}
                onClick={() => void handleSave("draft")}
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Save Draft"}
              </Button>

              <Button
                variant="primary"
                fullWidth={false}
                onClick={() => void handleSave("published")}
                disabled={isPending}
              >
                {isPending ? "Publishing..." : "Publish Product"}
              </Button>
            </>
          ) : (
            <>
              {product.status === "published" && (
                <Button
                  variant="danger-subtle"
                  fullWidth={false}
                  className="gap-1.5"
                  onClick={onArchive}
                  disabled={isPending}
                >
                  <Archive className="size-3.5" aria-hidden="true" />
                  Archive
                </Button>
              )}

              <Button
                variant="primary"
                fullWidth={false}
                onClick={() => void handleSave()}
                disabled={isPending}
              >
                {isPending ? "Updating..." : "Update"}
              </Button>

              {product.status === "draft" && (
                <Button
                  variant="primary"
                  fullWidth={false}
                  onClick={onPublish}
                  disabled={isPending}
                >
                  Publish Product
                </Button>
              )}

              {product.status === "archived" && (
                <>
                  <Button
                    variant="secondary"
                    fullWidth={false}
                    onClick={onUnarchive}
                    disabled={isPending}
                  >
                    Unarchive
                  </Button>

                  <Button
                    variant="primary"
                    fullWidth={false}
                    onClick={onPublish}
                    disabled={isPending}
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
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 text-xs md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="product-name" required>
                Product Name
              </FieldLabel>
              <Input
                id="product-name"
                required
                maxLength={PRODUCT_FIELD_LIMITS.name}
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="e.g. Smart Doorbell Pro"
                className="bg-surface-muted"
                disabled={isPending}
              />
            </div>

            <div>
              <FieldLabel htmlFor="product-sku">Model / SKU</FieldLabel>
              <Input
                id="product-sku"
                maxLength={PRODUCT_FIELD_LIMITS.sku}
                value={values.sku}
                onChange={(event) => updateField("sku", event.target.value)}
                placeholder="e.g. DOOR-BELL-PRO"
                className="bg-surface-muted font-mono"
                disabled={isPending}
              />
            </div>
          </div>

          <ProductImagePicker
            productName={values.name}
            imageUrl={product?.imageUrl}
            disabled={isPending}
            onChange={handleImageChange}
          />

          <div>
            <FieldLabel htmlFor="product-description" required>
              Description
            </FieldLabel>
            <textarea
              id="product-description"
              value={values.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              required
              maxLength={PRODUCT_FIELD_LIMITS.description}
              rows={6}
              disabled={isPending}
              placeholder="Describe product details and key features for AI matching..."
              className={`${fieldControlStyles} resize-y px-3.5 py-2.5 leading-relaxed`}
            />
            <p className="mt-1.5 text-right text-[10px] text-muted-foreground">
              {values.description.length}/{PRODUCT_FIELD_LIMITS.description}{" "}
              characters
            </p>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-danger">
              {error}
            </p>
          )}
        </form>
      </Card>
    </section>
  );
}
