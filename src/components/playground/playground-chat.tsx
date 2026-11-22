"use client";

import { useRouter } from "next/navigation";
import { Bot, RotateCcw, Send } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductImage } from "@/components/products/product-image";
import { ProductImagePlaceholder } from "@/components/products/product-image-placeholder";
import type { Product } from "@/lib/products/types";
import type { PlaygroundChatData } from "@/temp-data/playground-chat";

interface PlaygroundChatProps {
  product: Product;
  chat: PlaygroundChatData;
}

export function PlaygroundChat({ product, chat }: PlaygroundChatProps) {
  const router = useRouter();

  return (
    <main className="mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden p-4 sm:p-6">
      <section className="flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-5">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <BackButton
            onClick={() => router.push("/playground")}
            ariaLabel="Back to Playground"
          />

          <div>
            <h1 className="text-base font-bold text-foreground">
              Test your product assistant
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Preview how your assistant responds to customer questions about
              the selected product.
            </p>
          </div>
        </div>

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-surface-muted sm:size-16">
                {product.imageUrl ? (
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.name}
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <ProductImagePlaceholder />
                )}
              </div>

              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  {product.sku}
                </p>
                <h1 className="truncate text-sm font-bold text-foreground">
                  {product.name}
                </h1>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {product.description}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              fullWidth={false}
              aria-label="Restart conversation"
              className="gap-2"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Restart
            </Button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-1 pt-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bot className="size-5" aria-hidden="true" />
              </div>

              <div className="max-w-[85%] space-y-2">
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  AI Assistant
                </p>
                <div className="rounded-2xl rounded-tl-sm border border-border bg-surface-muted p-3 text-xs leading-relaxed text-foreground">
                  {chat.assistantMessage}
                </div>
              </div>
            </div>

            <div className="ml-12 space-y-2">
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Suggested Questions
              </p>

              <div className="flex flex-col items-start gap-1.5">
                {chat.suggestedQuestions.map((question) => (
                  <button
                    key={question.id}
                    type="button"
                    className="inline-flex min-h-11 w-fit max-w-full items-center rounded-2xl rounded-bl-sm border border-primary/15 bg-primary/5 px-3 py-2 text-left text-xs leading-relaxed font-medium text-primary transition-colors hover:border-primary/30 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <span className="min-w-0">{question.question}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <div className="max-w-[85%] space-y-2">
                <p className="text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  You
                </p>
                <div className="rounded-2xl rounded-tr-sm bg-primary p-3 text-xs leading-relaxed text-primary-foreground">
                  {chat.sampleUserMessage}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex shrink-0 items-center gap-2 border-t border-border pt-4">
            <Input
              type="text"
              placeholder="Type your message..."
              aria-label="Your message"
              className="min-w-0 flex-1 bg-surface"
            />

            <Button
              variant="primary"
              fullWidth={false}
              aria-label="Send message"
              title="Send message"
            >
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
