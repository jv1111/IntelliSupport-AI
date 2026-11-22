"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAllProducts } from "@/lib/products";
import type { Product } from "@/lib/products/types";

export function usePlaygroundProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchAllProducts();

        if (!cancelled) {
          setProducts(result);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load products. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const retry = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return {
    products,
    isLoading,
    error,
    retry,
  };
}
