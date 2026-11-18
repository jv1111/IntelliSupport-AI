import { Suspense } from "react";
import { PageLoadingFallback } from "@/components/layout/page-loading-fallback";
import { ProductCatalog } from "@/components/products/product-catalog";
import type { ProductStatus } from "@/lib/products/types";

interface ProductsPageProps {
  searchParams: Promise<{ status?: string | string[] }>;
}

async function ProductsContent({ searchParams }: ProductsPageProps) {
  const { status } = await searchParams;

  const initialStatus: ProductStatus =
    status === "draft" || status === "archived" ? status : "published";

  return <ProductCatalog initialStatus={initialStatus} />;
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <Suspense fallback={<PageLoadingFallback message="Loading products..." />}>
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  );
}
