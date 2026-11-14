import { Suspense } from "react";
import { ProductEditor } from "@/components/products/product-editor";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

async function EditProductContent({ params }: EditProductPageProps) {
  const { id } = await params;

  return <ProductEditor productId={id} />;
}

function EditProductFallback() {
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

export default function EditProductPage({ params }: EditProductPageProps) {
  return (
    <Suspense fallback={<EditProductFallback />}>
      <EditProductContent params={params} />
    </Suspense>
  );
}
