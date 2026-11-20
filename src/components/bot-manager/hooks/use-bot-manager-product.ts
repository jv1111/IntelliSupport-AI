"use client";

import { useEffect, useState } from "react";
import { fetchProduct } from "@/lib/products";
import type { Product } from "@/lib/products/types";

interface ProductLoadState {
  productId: string;
  product: Product | null;
  error: string | null;
}

export function useBotManagerProduct(productId?: string) {
  const [state, setState] = useState<ProductLoadState>({
    productId: "",
    product: null,
    error: null,
  });

  useEffect(() => {
    if (!productId) {
      return;
    }

    let cancelled = false;

    async function loadProduct(requestedProductId: string) {
      try {
        const product = await fetchProduct(requestedProductId);

        if (!cancelled) {
          setState({
            productId: requestedProductId,
            product,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            productId: requestedProductId,
            product: null,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load product. Please try again.",
          });
        }
      }
    }

    void loadProduct(productId);

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const hasCurrentProduct = Boolean(productId) && state.productId === productId;

  return {
    product: hasCurrentProduct ? state.product : null,
    isLoading: Boolean(productId) && !hasCurrentProduct,
    error: hasCurrentProduct ? state.error : null,
  };
}
