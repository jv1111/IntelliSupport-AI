"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { PackageOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { PrimaryActionLink } from "@/components/ui/primary-action-link";
import { PageHeader } from "@/components/ui/page-header";
import { ProductCard } from "@/components/products/product-card";
import { useProductCatalog } from "@/components/products/hooks/use-product-catalog";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { productStatusLabels } from "@/components/products/data";
import type { ProductStatus } from "@/lib/products/types";

interface ProductCatalogProps {
  initialStatus: ProductStatus;
}

const statusTabs: { label: string; value: ProductStatus }[] = [
  { label: productStatusLabels.published, value: "published" },
  { label: productStatusLabels.draft, value: "draft" },
  { label: productStatusLabels.archived, value: "archived" },
];

export function ProductCatalog({ initialStatus }: ProductCatalogProps) {
  const router = useRouter();

  const {
    status,
    searchInput,
    setSearchInput,
    productPage,
    isLoading,
    isLoadingMore,
    loadMore,
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

  const productScrollRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useInfiniteScroll({
    rootRef: productScrollRef,
    targetRef: loadMoreRef,
    enabled:
      productPage.hasNextPage && !isLoading && !isLoadingMore && !fetchError,
    onLoadMore: loadMore,
  });

  return (
    <main className="mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden p-6">
      <section className="flex min-h-0 flex-1 flex-col gap-6">
        <PageHeader
          title="Registered Products Catalog"
          description="Manage published items for AI response generation or save products as drafts."
          action={{
            label: "Add Product",
            onClick: () => router.push("/products/new"),
          }}
        />

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
          <div
            ref={productScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2"
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 2xl:grid-cols-5">
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

            {productPage.hasNextPage && (
              <div
                ref={loadMoreRef}
                className="flex min-h-16 items-center justify-center py-4"
              >
                {isLoadingMore && (
                  <p
                    className="text-xs font-medium text-muted-foreground"
                    role="status"
                  >
                    Loading more products...
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            variant="card"
            icon={PackageOpen}
            title="No products found"
            description={
              searchInput.trim()
                ? "Try a different product name or clear your search."
                : "Add a product or select another status to view your catalog."
            }
            action={
              searchInput.trim() ? (
                <Button variant="text" onClick={clearSearch} className="mt-4">
                  Clear Search
                </Button>
              ) : (
                <PrimaryActionLink href="/products/new" className="mt-4 px-4">
                  Add Product
                </PrimaryActionLink>
              )
            }
          />
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
