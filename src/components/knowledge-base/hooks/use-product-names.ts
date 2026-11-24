"use client";

import { useEffect, useState } from "react";
import { fetchAllProducts } from "@/lib/products";

export function useProductNames() {
  const [productNames, setProductNames] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchAllProducts()
      .then((products) => {
        if (!cancelled) {
          setProductNames(
            new Map(products.map((product) => [product.id, product.name])),
          );
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsLoadingProducts(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { productNames, isLoadingProducts };
}
