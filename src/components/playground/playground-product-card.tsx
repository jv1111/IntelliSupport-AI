import { Card } from "@/components/ui/card";
import { ProductImage } from "@/components/products/product-image";
import { ProductImagePlaceholder } from "@/components/products/product-image-placeholder";
import type { Product } from "@/lib/products/types";

interface PlaygroundProductCardProps {
  product: Product;
}

export function PlaygroundProductCard({ product }: PlaygroundProductCardProps) {
  return (
    <article className="h-full">
      <Card variant="interactive" className="flex h-full flex-col">
        <div className="relative aspect-4/3 shrink-0 overflow-hidden bg-surface-muted">
          {product.imageUrl ? (
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ProductImagePlaceholder />
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            {product.sku}
          </p>

          <h2 className="text-sm font-bold text-foreground">{product.name}</h2>

          <p className="mt-2 line-clamp-3 min-h-15 text-xs leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </div>
      </Card>
    </article>
  );
}
