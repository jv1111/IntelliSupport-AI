"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Bot, RotateCcw, Send } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductImage } from "@/components/products/product-image";
import { ProductImagePlaceholder } from "@/components/products/product-image-placeholder";
import { usePlaygroundChat } from "@/components/playground/hooks/use-playground-chat";
import type { Product } from "@/lib/products/types";
import type { AutoReply } from "@/lib/auto-replies/types";
import { useAutoScroll } from "@/hooks/use-auto-scroll";

interface PlaygroundChatProps {
  product: Product;
  autoReplies: AutoReply[];
  autoRepliesEnabled: boolean;
}

export function PlaygroundChat({
  product,
  autoReplies,
  autoRepliesEnabled,
}: PlaygroundChatProps) {
  const router = useRouter();

  const {
    messages,
    messageDraft,
    setMessageDraft,
    suggestedReplies,
    hasAutoReplies,
    showResolutionPrompt,
    isInputDisabled,
    isSending,
    geminiError,
    sendMessage,
    selectReply,
    answerResolution,
    restart,
  } = usePlaygroundChat(
    product.id,
    product.name,
    autoReplies,
    autoRepliesEnabled,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  const inputPlaceholder = isSending
    ? "AI Gemini is thinking..."
    : "Type your message...";

  const messagesContainerRef = useAutoScroll<HTMLDivElement>(messages.length);

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
              Preview how your assistant responds to customer messages about the
              selected product.
            </p>
          </div>
        </div>

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                {product.imageUrl ? (
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.name}
                    sizes="48px"
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
              onClick={restart}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Restart
            </Button>
          </div>

          <div
            ref={messagesContainerRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-1 pt-4"
            role="log"
            aria-label="Conversation"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((message) =>
              message.role === "assistant" ? (
                <div key={message.id} className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Bot className="size-5" aria-hidden="true" />
                  </div>

                  <div className="max-w-[85%] space-y-2">
                    <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      {message.provider === "gemini"
                        ? "AI Gemini"
                        : "AI Assistant"}
                    </p>
                    <div className="rounded-2xl rounded-tl-sm border border-border bg-surface-muted p-3 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                      {message.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] space-y-2">
                    <p className="text-right text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      You
                    </p>
                    <div className="rounded-2xl rounded-tr-sm bg-primary p-3 text-xs leading-relaxed whitespace-pre-wrap text-primary-foreground">
                      {message.content}
                    </div>
                  </div>
                </div>
              ),
            )}

            {suggestedReplies.length > 0 && (
              <div className="ml-12 space-y-2">
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Suggested Messages
                </p>

                <div className="flex flex-col items-start gap-1.5">
                  {suggestedReplies.map((reply) => (
                    <button
                      key={reply.id}
                      type="button"
                      className="inline-flex min-h-11 w-fit max-w-full items-center rounded-2xl rounded-bl-sm border border-primary/15 bg-primary/5 px-3 py-2 text-left text-xs leading-relaxed font-medium text-primary transition-colors hover:border-primary/30 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      onClick={() => selectReply(reply)}
                    >
                      <span className="min-w-0">{reply.message}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!autoRepliesEnabled ? (
              <div
                className="ml-12 rounded-xl border border-border bg-surface-muted p-3 text-xs text-muted-foreground"
                role="status"
              >
                Suggested messages are disabled in your Bot Settings. You can
                still chat with AI Gemini.
              </div>
            ) : !hasAutoReplies ? (
              <div
                className="ml-12 rounded-xl border border-border bg-surface-muted p-3 text-xs text-muted-foreground"
                role="status"
              >
                No suggested messages are configured for this product yet. You
                can still ask AI Gemini a message.
              </div>
            ) : null}

            {geminiError && (
              <div
                className="ml-12 rounded-xl border border-border bg-surface-muted p-3 text-xs text-muted-foreground"
                role="alert"
              >
                {geminiError}
              </div>
            )}

            {isSending && (
              <div className="ml-12 space-y-2" role="status">
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  AI Gemini
                </p>
                <div className="w-fit rounded-2xl rounded-tl-sm border border-border bg-surface-muted p-3 text-xs text-muted-foreground">
                  Thinking...
                </div>
              </div>
            )}

            {showResolutionPrompt && (
              <div
                className="ml-12 space-y-2"
                role="group"
                aria-label="Issue resolution"
              >
                <p className="text-xs font-medium text-foreground">
                  Was your issue resolved?
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    onClick={() => answerResolution(true)}
                  >
                    Yes
                  </button>

                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    onClick={() => answerResolution(false)}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>

          <form
            className="mt-4 flex shrink-0 items-center gap-2 border-t border-border pt-4"
            onSubmit={handleSubmit}
          >
            <Input
              type="text"
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              placeholder={inputPlaceholder}
              aria-label="Your message"
              autoComplete="off"
              disabled={isInputDisabled}
              className="min-w-0 flex-1 bg-surface"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth={false}
              aria-label="Send message"
              title="Send message"
              disabled={isInputDisabled || !messageDraft.trim()}
            >
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
