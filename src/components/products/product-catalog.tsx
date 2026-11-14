"use client";

import Link from "next/link";
import { PackageOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { ProductCard } from "@/components/products/product-card";
import { useProductCatalog } from "@/components/products/hooks/use-product-catalog";
import type { ProductStatus } from "@/lib/products";

interface ProductCatalogProps {
  initialStatus: ProductStatus;
}

const statusTabs: { label: string; value: ProductStatus }[] = [
  { label: "Published Products", value: "published" },
  { label: "Drafts", value: "draft" },
  { label: "Archived", value: "archived" },
];

const addProductLinkStyles =
  "inline-flex items-center justify-center rounded-xl bg-linear-to-r from-primary to-secondary p-3 text-xs font-bold tracking-wider text-primary-foreground transition-all duration-150 ease-out hover:scale-[1.01] hover:from-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15";

export function ProductCatalog({ initialStatus }: ProductCatalogProps) {
  const {
    status,
    searchInput,
    setSearchInput,
    productPage,
    isLoading,
    fetchError,
    actionError,
    unarchivingProductId,
    productPendingDeletion,
    deletingProductId,
    changeStatus,
    unarchiveProduct,
    openDeleteConfirmation,
    closeDeleteConfirmation,
    confirmDeleteProduct,
    clearSearch,
    retry,
  } = useProductCatalog(initialStatus);

  return (
    <main className="mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden p-6">
      <section className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-foreground">
              Registered Products Catalog
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage published items for AI response generation or save products
              as drafts.
            </p>
          </div>

          <Link href="/products/new" className={addProductLinkStyles}>
            Add Product
          </Link>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border pb-3">
          {statusTabs.map((tab) => {
            const isActive = status === tab.value;

            return (
              <Button
                key={tab.value}
                variant="tab"
                active={isActive}
                aria-pressed={isActive}
                onClick={() => changeStatus(tab.value)}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
          <div className="w-full max-w-md">
            <SearchInput
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search products by name..."
              aria-label="Search products by name"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {productPage.totalCount}{" "}
            {productPage.totalCount === 1 ? "product" : "products"}
          </p>
        </div>

        {(fetchError || (actionError && !productPendingDeletion)) && (
          <div
            role="alert"
            className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 text-xs text-danger"
          >
            <span>{fetchError ?? actionError}</span>
            {fetchError && (
              <Button
                variant="text"
                onClick={retry}
                className="text-danger hover:text-danger"
              >
                Try again
              </Button>
            )}
          </div>
        )}

        {isLoading ? (
          <div
            className="flex min-h-64 items-center justify-center text-xs font-medium text-muted-foreground"
            role="status"
          >
            Loading products...
          </div>
        ) : productPage.items.length > 0 ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {productPage.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onUnarchive={unarchiveProduct}
                  isUnarchiving={unarchivingProductId === product.id}
                  onDelete={openDeleteConfirmation}
                  isDeleting={deletingProductId === product.id}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card className="flex min-h-72 flex-1 flex-col items-center justify-center border-dashed px-6 py-12 text-center shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground">
              <PackageOpen className="size-6" aria-hidden="true" />
            </div>

            <h2 className="mt-4 text-sm font-bold text-foreground">
              No products found
            </h2>

            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {searchInput.trim()
                ? "Try a different product name or clear your search."
                : "Add a product or select another status to view your catalog."}
            </p>

            {searchInput.trim() ? (
              <Button variant="text" onClick={clearSearch} className="mt-4">
                Clear Search
              </Button>
            ) : (
              <Link
                href="/products/new"
                className={`${addProductLinkStyles} mt-4 px-4`}
              >
                Add Product
              </Link>
            )}
          </Card>
        )}
      </section>
      <ConfirmationDialog
        open={Boolean(productPendingDeletion)}
        title="Delete archived product?"
        description={`"${productPendingDeletion?.name ?? ""}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete Product"
        pendingLabel="Deleting..."
        variant="danger"
        icon={Trash2}
        isPending={Boolean(deletingProductId)}
        error={productPendingDeletion ? actionError : null}
        onConfirm={confirmDeleteProduct}
        onCancel={closeDeleteConfirmation}
      />
    </main>
  );
}
