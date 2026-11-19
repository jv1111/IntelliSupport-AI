"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useBotManagerProducts } from "@/components/bot-manager/hooks/use-bot-manager-products";
import { useAutoReplyForm } from "@/components/bot-manager/hooks/use-auto-reply-form";
import type { BotManagerView } from "@/components/bot-manager/types";

export function useAutoReplyEditor() {
  const router = useRouter();
  const { products, productsLoading, productsError, refreshProducts } =
    useBotManagerProducts();

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [, setSelectedParentId] = useState<string | null>(null);
  const [, setView] = useState<BotManagerView>("form");

  const exitEditor = useCallback(() => {
    router.push("/bot-manager");
  }, [router]);

  const form = useAutoReplyForm({
    selectedProductId,
    setSelectedProductId,
    setSelectedParentId,
    setView,
    onExit: exitEditor,
  });

  return {
    title: "Add Auto Reply",
    values: form.formValues,
    products,
    productsLoading,
    productsError,
    retryProducts: refreshProducts,
    groups: form.formGroups,
    isFollowUp: false,
    parentQuestion: null,
    error: form.formError,
    onChange: form.updateFormValue,
    onSubmit: form.saveReply,
    onCancel: form.closeForm,
  };
}
