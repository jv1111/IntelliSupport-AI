import { ProductEditor } from "@/components/products/product-editor";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  return <ProductEditor productId={id} />;
}
