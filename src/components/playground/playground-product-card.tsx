import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
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

          <StatusBadge
            status={product.status}
            className="absolute top-3 right-3"
          />
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4 p-5">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {product.sku}
            </p>

            <h2 className="text-sm font-bold text-foreground">
              {product.name}
            </h2>

            <p className="mt-2 line-clamp-3 min-h-15 text-xs leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
            <span className="min-w-0 truncate text-[10px] font-medium text-muted-foreground">
              {product.id}
            </span>

            <Link
              href={`/playground/chat?productId=${product.id}`}
              aria-label={`Ask about ${product.name}`}
              className="inline-flex items-center gap-1.5 rounded-sm text-[11px] font-bold text-primary hover:text-primary-hover hover:underline"
            >
              <MessageCircle className="size-3.5" aria-hidden="true" />
              Ask for Help
            </Link>
          </div>
        </div>
      </Card>
    </article>
  );
}
