import { Card } from "@/components/ui/card";
import { ProductImage } from "@/components/products/product-image";
import { ProductImagePlaceholder } from "@/components/products/product-image-placeholder";
import type { Product } from "@/lib/products/types";

interface AutoReplyProductCardProps {
  product: Product;
  questionCount: number;
  onSelect: () => void;
}

export function AutoReplyProductCard({
  product,
  questionCount,
  onSelect,
}: AutoReplyProductCardProps) {
  return (
    <Card variant="interactive" className="h-full">
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
      >
        <div className="relative aspect-4/3 overflow-hidden bg-surface-muted">
          {product.imageUrl ? (
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ProductImagePlaceholder />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground">
              {product.name}
            </h3>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {product.sku}
            </p>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary">
            {questionCount} {questionCount === 1 ? "question" : "questions"}
          </span>
        </div>
      </button>
    </Card>
  );
}
