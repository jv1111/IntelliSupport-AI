"use client";

import { ProductsView } from "@/components/bot-manager/views/products-view";
import { useBotManagerCatalog } from "@/components/bot-manager/hooks/use-bot-manager-catalog";

export function BotManagerCatalog() {
  const {
    aiEnabled,
    autoRepliesEnabled,
    products,
    search,
    setSearch,
    setAiEnabled,
    setAutoRepliesEnabled,
    openNewAutoReply,
    openProduct,
  } = useBotManagerCatalog();

  return (
    <main className="mx-auto flex min-h-full w-full flex-col gap-6 p-6 sm:p-8">
      <ProductsView
        aiEnabled={aiEnabled}
        autoRepliesEnabled={autoRepliesEnabled}
        products={products}
        search={search}
        onAiEnabledChange={setAiEnabled}
        onAutoRepliesEnabledChange={setAutoRepliesEnabled}
        onAddAutoReply={openNewAutoReply}
        onSelectProduct={openProduct}
        onSearchChange={setSearch}
      />
    </main>
  );
}
