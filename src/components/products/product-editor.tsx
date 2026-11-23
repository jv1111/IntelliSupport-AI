"use client";

import { useState } from "react";
import { Archive } from "lucide-react";
import { useProductEditor } from "@/components/products/hooks/use-product-editor";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { clearFormDraft } from "@/hooks/use-form-draft";

interface ProductEditorProps {
  productId?: string;
}

export function ProductEditor({ productId }: ProductEditorProps) {
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);

  const {
    product,
    isLoading,
    loadError,
    isSaving,
    actionError,
    isArchiveOpen,
    closeEditor,
    saveProduct,
    openArchiveConfirmation,
    closeArchiveConfirmation,
    archiveProduct,
    unarchiveProduct,
    publishProduct,
  } = useProductEditor(productId);

  function handleCancel() {
    if (productId) {
      closeEditor();
      return;
    }

    setIsDiscardOpen(true);
  }

  function handleDiscard() {
    clearFormDraft("product");
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
          Loading product...
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
          Back to Products
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full p-6">
      <ProductForm
        product={product}
        isPending={isSaving}
        error={actionError}
        onCancel={handleCancel}
        onSave={saveProduct}
        onArchive={openArchiveConfirmation}
        onUnarchive={unarchiveProduct}
        onPublish={publishProduct}
      />

      <ConfirmationDialog
        open={isDiscardOpen}
        title="Discard product changes?"
        description="Your saved form draft will be permanently cleared. This action cannot be undone."
        confirmLabel="Discard Changes"
        variant="danger"
        onConfirm={handleDiscard}
        onCancel={() => setIsDiscardOpen(false)}
      />

      <ConfirmationDialog
        open={isArchiveOpen}
        title="Archive product?"
        description={`"${product?.name ?? ""}" will be moved to the archived products catalog. You can still edit it later.`}
        confirmLabel="Archive Product"
        pendingLabel="Archiving..."
        variant="danger"
        icon={Archive}
        isPending={isSaving}
        error={actionError}
        onConfirm={archiveProduct}
        onCancel={closeArchiveConfirmation}
      />
    </main>
  );
}
