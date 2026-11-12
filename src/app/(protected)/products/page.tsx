import { ProductCatalog } from "@/components/products/product-catalog";
import type { ProductStatus } from "@/lib/products";

interface ProductsPageProps {
  searchParams: Promise<{ status?: string | string[] }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { status } = await searchParams;

  const initialStatus: ProductStatus =
    status === "draft" || status === "archived" ? status : "published";

  return <ProductCatalog initialStatus={initialStatus} />;
}
