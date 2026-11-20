"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Toggle } from "@/components/ui/toggle";
import { ProductImage } from "@/components/products/product-image";
import { useBotManagerProducts } from "@/components/bot-manager/hooks/use-bot-manager-products";
import { useBotManagerQuestions } from "@/components/bot-manager/hooks/use-bot-manager-questions";

export function BotManager() {
  const router = useRouter();
  const [aiEnabled, setAiEnabled] = useState(true);
  const [autoRepliesEnabled, setAutoRepliesEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const { products, isLoading, error, retry } = useBotManagerProducts();
  const { questions } = useBotManagerQuestions();

  const query = searchQuery.trim().toLowerCase();
  const filteredProducts = products.flatMap((product) => {
    const productQuestions = questions[product.id] ?? [];
    const questionCount = productQuestions.filter(
      (item) => item.question.trim() && item.answer.trim(),
    ).length;
    const matchesSearch =
      !query || `${product.name} ${product.sku}`.toLowerCase().includes(query);

    return questionCount > 0 && matchesSearch
      ? [{ product, questionCount }]
      : [];
  });

  return (
    <main className="min-h-full p-5 sm:p-6">
      <div className="space-y-6">
        <section aria-labelledby="ai-support-assistant-heading">
          <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4">
              <div
                className={`flex size-11 items-center justify-center rounded-2xl ${
                  aiEnabled
                    ? "bg-primary/10 text-primary"
                    : "bg-surface-muted text-muted-foreground"
                }`}
              >
                <Bot className="size-5" aria-hidden="true" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="ai-support-assistant-heading"
                    className="text-sm font-bold text-foreground"
                  >
                    AI Support Assistant
                  </h2>

                  <StatusBadge
                    status={aiEnabled ? "enabled" : "disabled"}
                    variant="pill"
                    label={aiEnabled ? "Enabled" : "Disabled"}
                  />
                </div>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {aiEnabled
                    ? "AI is replying to customer chats using your Knowledge Base and auto replies."
                    : "AI is off. Customer chats will wait for a manual reply."}
                </p>
              </div>
            </div>

            <Toggle
              checked={aiEnabled}
              onCheckedChange={setAiEnabled}
              label="Enable or disable AI"
            />
          </Card>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Automatic Chat Replies
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
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
                onCheckedChange={setAutoRepliesEnabled}
                label="Turn automatic chat replies on or off"
              />
            </div>

            <Button
              variant="primary"
              fullWidth={false}
              onClick={() => router.push("/bot-manager/new")}
            >
              Add Auto Reply
            </Button>
          </div>
        </section>

        <section aria-labelledby="product-catalog-heading">
          <Card className="p-4 sm:p-5">
            <div className="mb-4">
              <h2
                id="product-catalog-heading"
                className="text-sm font-bold text-foreground"
              >
                Products with Questions & Answers
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Select a product to manage its saved questions and answers,
                update replies, and organize follow-up questions.
              </p>
            </div>

            <div className="mb-4 w-full max-w-md">
              <SearchInput
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
              />
            </div>

            {isLoading ? (
              <p
                role="status"
                className="py-10 text-center text-xs text-muted-foreground"
              >
                Loading products...
              </p>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <p role="alert" className="text-center text-xs text-danger">
                  {error}
                </p>
                <Button
                  variant="secondary"
                  fullWidth={false}
                  type="button"
                  onClick={retry}
                >
                  Try again
                </Button>
              </div>
            ) : filteredProducts.length > 0 ? (
              <ul
                className={`divide-y divide-border/70 transition-opacity ${
                  autoRepliesEnabled ? "" : "opacity-50"
                }`}
              >
                {filteredProducts.map(({ product, questionCount }) => (
                  <li key={product.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/bot-manager/${product.id}/question-editor`}
                      aria-label={`Manage automatic replies for ${product.name}`}
                      className="group flex items-center gap-4 rounded-xl focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:outline-none"
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                        <ProductImage
                          src={product.imageUrl ?? ""}
                          alt={`${product.name} product image`}
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                          {product.name}
                        </h3>

                        <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground transition-colors group-hover:text-primary/70">
                          {product.sku}
                        </p>
                      </div>

                      <StatusBadge
                        status={product.status}
                        className="shrink-0"
                      />

                      <span className="shrink-0 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary">
                        {questionCount}{" "}
                        {questionCount === 1 ? "question" : "questions"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                role="status"
                className="py-10 text-center text-xs font-medium text-muted-foreground"
              >
                No products with saved questions and answers found.
              </p>
            )}
          </Card>
        </section>
      </div>
    </main>
  );
}
