"use client";

import { PlaygroundProductCard } from "@/components/playground/playground-product-card";
import { PageHeader } from "@/components/ui/page-header";
import { usePlaygroundProducts } from "@/components/playground/hooks/use-playground-products";

export function Playground() {
  const { products, isLoading, error, retry } = usePlaygroundProducts();

  return (
    <main className="mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden p-6">
      <section className="flex min-h-0 flex-1 flex-col gap-6">
        <PageHeader
          title="Select a product to test"
          description="Chat with your bot as a customer would, using the auto replies you set for the product."
        />

        <div className="shrink-0 border-b border-border" aria-hidden="true" />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
          {isLoading ? (
            <div
              className="flex min-h-40 items-center justify-center text-sm text-muted-foreground"
              role="status"
            >
              Loading products...
            </div>
          ) : error ? (
            <div
              className="flex min-h-40 flex-col items-center justify-center gap-3"
              role="alert"
            >
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                onClick={retry}
              >
                Try again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-2">
              <h2 className="text-base font-semibold">No products found</h2>
              <p className="text-sm text-muted-foreground">
                Create a product first to start testing your bot.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 2xl:grid-cols-5">
              {products.map((product) => (
                <PlaygroundProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
