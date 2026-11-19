"use client";

import { PackageOpen } from "lucide-react";
import { AutoReplyForm } from "@/components/bot-manager/auto-reply-form";
import { useAutoReplyEditor } from "@/components/bot-manager/hooks/use-auto-reply-editor";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PrimaryActionLink } from "@/components/ui/primary-action-link";

export function AutoReplyEditor() {
  const form = useAutoReplyEditor();

  return (
    <main className="mx-auto flex min-h-full w-full flex-col gap-6 p-6 sm:p-8">
      {form.productsLoading ? (
        <div
          className="flex min-h-48 items-center justify-center text-xs font-medium text-muted-foreground"
          role="status"
        >
          Loading products...
        </div>
      ) : form.productsError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 text-xs text-danger"
        >
          <span>{form.productsError}</span>
          <Button
            variant="text"
            onClick={form.retryProducts}
            className="text-danger hover:text-danger"
          >
            Try again
          </Button>
        </div>
      ) : form.products.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No products available"
          description="Add a product before creating an automatic reply."
          action={
            <PrimaryActionLink href="/products/new" className="mt-4 px-4">
              Add Product
            </PrimaryActionLink>
          }
        />
      ) : (
        <AutoReplyForm
          title={form.title}
          values={form.values}
          products={form.products}
          groups={form.groups}
          isFollowUp={form.isFollowUp}
          parentQuestion={form.parentQuestion}
          error={form.error}
          onChange={form.onChange}
          onSubmit={form.onSubmit}
          onCancel={form.onCancel}
        />
      )}
    </main>
  );
}
