import { Suspense } from "react";
import { ProductCatalog } from "@/components/products/product-catalog";
import type { ProductStatus } from "@/lib/products/types";

interface ProductsPageProps {
  searchParams: Promise<{ status?: string | string[] }>;
}

function ProductsFallback() {
  return (
    <main className="mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden p-6">
      <section className="flex min-h-0 flex-1 flex-col gap-6">
        <div
          className="flex min-h-64 flex-1 items-center justify-center text-xs font-medium text-muted-foreground"
          role="status"
        >
          Loading products...
        </div>
      </section>
    </main>
  );
}

async function ProductsContent({ searchParams }: ProductsPageProps) {
  const { status } = await searchParams;

  const initialStatus: ProductStatus =
    status === "draft" || status === "archived" ? status : "published";

  return <ProductCatalog initialStatus={initialStatus} />;
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <Suspense fallback={<ProductsFallback />}>
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  );
}
