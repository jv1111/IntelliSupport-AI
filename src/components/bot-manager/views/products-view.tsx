import { Bot, Layers } from "lucide-react";
import { AutoReplyProductCard } from "@/components/bot-manager/auto-reply-product-card";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import type { Product } from "@/lib/products/types";

interface ProductsViewItem {
  product: Product;
  questionCount: number;
}

interface ProductsViewProps {
  aiEnabled: boolean;
  autoRepliesEnabled: boolean;
  products: ProductsViewItem[];
  isLoading: boolean;
  productsError: string | null;
  search: string;
  onRetry: () => void;
  onAiEnabledChange: (enabled: boolean) => void;
  onAutoRepliesEnabledChange: (enabled: boolean) => void;
  onAddAutoReply: () => void;
  onSelectProduct: (productId: string) => void;
  onSearchChange: (value: string) => void;
}

export function ProductsView({
  aiEnabled,
  autoRepliesEnabled,
  products,
  isLoading,
  productsError,
  search,
  onRetry,
  onAiEnabledChange,
  onAutoRepliesEnabledChange,
  onAddAutoReply,
  onSelectProduct,
  onSearchChange,
}: ProductsViewProps) {
  return (
    <>
      <Card className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 shadow-sm">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
              aiEnabled
                ? "bg-primary/10 text-primary"
                : "bg-surface-muted text-muted-foreground"
            }`}
          >
            <Bot className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">
                AI Support Assistant
              </h2>

              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  aiEnabled
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-border bg-surface-muted text-muted-foreground"
                }`}
              >
                {aiEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {aiEnabled
                ? "AI is replying to customer chats using your Knowledge Base and automatic replies."
                : "AI is off. Customer chats will wait for a manual reply."}
            </p>
          </div>
        </div>

        <Toggle
          checked={aiEnabled}
          onCheckedChange={onAiEnabledChange}
          label="Enable or disable AI support assistant"
        />
      </Card>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Automatic Chat Replies
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Set instant static answers for common questions. When a
              customer&apos;s message matches a question, the answer is sent
              right away.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className={`text-xs font-bold ${
                  autoRepliesEnabled
                    ? "text-emerald-600"
                    : "text-muted-foreground"
                }`}
              >
                {autoRepliesEnabled ? "Auto Replies On" : "Auto Replies Off"}
              </span>

              <Toggle
                checked={autoRepliesEnabled}
                onCheckedChange={onAutoRepliesEnabledChange}
                label="Enable or disable automatic replies"
              />
            </div>

            <Button fullWidth={false} onClick={onAddAutoReply}>
              Add Auto Reply
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl p-4 shadow-sm">
          <div className="w-full sm:max-w-sm">
            <SearchInput
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
            />
          </div>
        </Card>

        <div
          className={`transition-opacity ${
            autoRepliesEnabled ? "" : "opacity-50"
          }`}
        >
          {productsError ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 text-xs text-danger"
            >
              <span>{productsError}</span>
              <Button
                variant="text"
                onClick={onRetry}
                className="text-danger hover:text-danger"
              >
                Try again
              </Button>
            </div>
          ) : isLoading ? (
            <div
              className="flex min-h-48 items-center justify-center text-xs font-medium text-muted-foreground"
              role="status"
            >
              Loading products...
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map(({ product, questionCount }) => (
                <AutoReplyProductCard
                  key={product.id}
                  product={product}
                  questionCount={questionCount}
                  onSelect={() => onSelectProduct(product.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              variant="card"
              icon={Layers}
              title={search.trim() ? "No products found" : "No products yet"}
              description={
                search.trim()
                  ? "Try another product name or SKU."
                  : "Add a product to your catalog to configure automatic replies."
              }
              action={
                search.trim() ? (
                  <Button
                    variant="text"
                    onClick={() => onSearchChange("")}
                    className="mt-3"
                  >
                    Clear Search
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
