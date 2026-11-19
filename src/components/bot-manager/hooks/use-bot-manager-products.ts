"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { fetchProducts } from "@/lib/products";
import type { Product } from "@/lib/products/types";

export function useBotManagerProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshProducts = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setProductsLoading(true);
      setProductsError(null);

      try {
        const allProducts: Product[] = [];
        let page = 1;
        let hasNextPage = true;

        while (hasNextPage) {
          const result = await fetchProducts({
            page,
            limit: DEFAULT_PAGE_SIZE,
            search: null,
            status: null,
          });

          if (cancelled) {
            return;
          }

          allProducts.push(...result.items);
          hasNextPage = result.hasNextPage;
          page += 1;
        }

        if (!cancelled) {
          setProducts(allProducts);
        }
      } catch (error) {
        if (!cancelled) {
          setProductsError(
            error instanceof Error
              ? error.message
              : "Unable to load products. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return {
    products,
    productsLoading,
    productsError,
    refreshProducts,
  };
}
