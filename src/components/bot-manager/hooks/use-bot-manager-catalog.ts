"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBotManagerState } from "@/components/bot-manager/bot-manager-provider";
import { useBotManagerProducts } from "@/components/bot-manager/hooks/use-bot-manager-products";

export function useBotManagerCatalog() {
  const router = useRouter();
  const {
    aiEnabled,
    setAiEnabled,
    autoRepliesEnabled,
    setAutoRepliesEnabled,
    replies,
  } = useBotManagerState();

  const {
    products: catalogProducts,
    productsLoading,
    productsError,
    refreshProducts,
  } = useBotManagerProducts();

  const [search, setSearch] = useState("");

  const products = useMemo(() => {
    const query = search.trim().toLowerCase();

    return catalogProducts
      .filter(
        (product) =>
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query),
      )
      .map((product) => ({
        product,
        questionCount: replies.filter((reply) => reply.productId === product.id)
          .length,
      }));
  }, [catalogProducts, replies, search]);

  const openNewAutoReply = useCallback(() => {
    router.push("/bot-manager/new");
  }, [router]);

  const openProduct = useCallback(
    (productId: string) => {
      router.push(
        `/bot-manager/editor?productId=${encodeURIComponent(productId)}`,
      );
    },
    [router],
  );

  return {
    aiEnabled,
    autoRepliesEnabled,
    products,
    productsLoading,
    productsError,
    retryProducts: refreshProducts,
    search,
    setSearch,
    setAiEnabled,
    setAutoRepliesEnabled,
    openNewAutoReply,
    openProduct,
  };
}
