"use client";

import Image from "next/image";
import Link from "next/link";
import { ArchiveRestore, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProductImagePlaceholder } from "@/components/products/product-image-placeholder";
import type { Product } from "@/lib/products";

const statusStyles: Record<Product["status"], string> = {
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
};

interface ProductCardProps {
  product: Product;
  onUnarchive: (productId: string) => void;
  isUnarchiving: boolean;
}

export function ProductCard({
  product,
  onUnarchive,
  isUnarchiving,
}: ProductCardProps) {
  return (
    <article className="h-full">
      <Card variant="interactive" className="flex h-full flex-col">
        <div className="relative aspect-4/3 shrink-0 overflow-hidden bg-surface-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              unoptimized
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <ProductImagePlaceholder />
          )}

          <span
            className={`absolute top-3 right-3 rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${statusStyles[product.status]}`}
          >
            {product.status}
          </span>
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
