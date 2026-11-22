import { PlaygroundProductCard } from "@/components/playground/playground-product-card";
import { PageHeader } from "@/components/ui/page-header";
import { playgroundProducts } from "@/temp-data/playground-products";

export function Playground() {
  return (
    <main className="mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden p-6">
      <section className="flex min-h-0 flex-1 flex-col gap-6">
        <PageHeader
          title="Select a product to test"
          description="Chat with your bot as a customer would, using the auto replies you set for the product."
        />

        <div className="shrink-0 border-b border-border" aria-hidden="true" />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 2xl:grid-cols-5">
            {playgroundProducts.map((product) => (
              <PlaygroundProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
