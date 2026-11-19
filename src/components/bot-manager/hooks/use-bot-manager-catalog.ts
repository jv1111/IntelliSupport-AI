"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { initialBotProducts } from "@/components/bot-manager/data";
import { useBotManagerState } from "@/components/bot-manager/bot-manager-provider";

export function useBotManagerCatalog() {
  const router = useRouter();
  const {
    aiEnabled,
    setAiEnabled,
    autoRepliesEnabled,
    setAutoRepliesEnabled,
    replies,
  } = useBotManagerState();

  const [search, setSearch] = useState("");

  const products = useMemo(() => {
    const query = search.trim().toLowerCase();

    return initialBotProducts
      .filter(
        (product) =>
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.model.toLowerCase().includes(query),
      )
      .map((product) => ({
        product,
        questionCount: replies.filter((reply) => reply.productId === product.id)
          .length,
      }));
  }, [replies, search]);

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
    search,
    setSearch,
    setAiEnabled,
    setAutoRepliesEnabled,
    openNewAutoReply,
    openProduct,
  };
}
