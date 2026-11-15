"use client";

import { ProductImage } from "@/components/products/product-image";
import Link from "next/link";
import { ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProductImagePlaceholder } from "@/components/products/product-image-placeholder";
import type { Product } from "@/lib/products/types";

interface ProductCardProps {
  product: Product;
  onUnarchive: (productId: string) => void;
  isUnarchiving: boolean;
  onDelete: (product: Product) => void;
  isDeleting: boolean;
}

export function ProductCard({
  product,
  onUnarchive,
  isUnarchiving,
  onDelete,
  isDeleting,
}: ProductCardProps) {
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

          {product.status === "archived" && (
            <Button
              variant="danger-subtle"
              fullWidth={false}
              aria-label={`Delete ${product.name}`}
              title="Delete archived product"
              onClick={() => onDelete(product)}
              disabled={isDeleting}
              className="absolute top-3 left-3 z-10 size-9! rounded-full! p-0! shadow-sm"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          )}
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

            {product.status === "archived" ? (
              <button
                type="button"
                onClick={() => onUnarchive(product.id)}
                disabled={isUnarchiving}
                className="inline-flex items-center gap-1.5 rounded-sm text-[11px] font-bold text-primary hover:text-primary-hover hover:underline disabled:opacity-60"
              >
                <ArchiveRestore className="size-3.5" aria-hidden="true" />
                {isUnarchiving ? "Unarchiving..." : "Unarchive"}
              </button>
            ) : (
              <Link
                href={`/products/${product.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-sm text-[11px] font-bold text-primary hover:text-primary-hover hover:underline"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit Product
              </Link>
            )}
          </div>
        </div>
      </Card>
    </article>
  );
}
