"use client";

import { useRouter } from "next/navigation";
import { AutoReplyItem } from "@/components/bot-manager/auto-reply-item";
import { Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useBotManagerAutoReplies } from "@/components/bot-manager/hooks/use-bot-manager-auto-replies";
import { useBotManagerProduct } from "@/components/bot-manager/hooks/use-bot-manager-product";
import { useBotManagerProducts } from "@/components/bot-manager/hooks/use-bot-manager-products";
import { ProductImage } from "@/components/products/product-image";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { FieldLabel, fieldControlStyles } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { MAX_AUTO_REPLIES_PER_LEVEL } from "@/lib/auto-replies/constants";

interface QuestionEditorProps {
  productId?: string;
}

export function QuestionEditor({ productId }: QuestionEditorProps) {
  const isProductSelectionMode = productId === undefined;
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState(productId ?? "");
  const [isAddingMessage, setIsAddingMessage] = useState(false);
  const [editingAutoReplyId, setEditingAutoReplyId] = useState<string | null>(
    null,
  );
  const [autoReplyPendingDeletion, setAutoReplyPendingDeletion] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");

  const {
    products: availableProducts,
    isLoading: isLoadingProducts,
    error: productLoadError,
  } = useBotManagerProducts(isProductSelectionMode);

  const {
    product: routeProduct,
    isLoading: isLoadingProduct,
    error: productError,
  } = useBotManagerProduct(isProductSelectionMode ? undefined : productId);

  const activeProductId = productId ?? selectedProductId;
  const product = isProductSelectionMode
    ? availableProducts.find((item) => item.id === activeProductId)
    : routeProduct;

  const {
    autoReplies,
    isLoading: isLoadingAutoReplies,
    error: autoRepliesError,
    isSaving,
    isDeleting,
    isReordering,
    actionError,
    deletionError,
    reorderError,
    saveAutoReply,
    deleteAutoReply,
    moveAutoReply,
    retry: retryAutoReplies,
  } = useBotManagerAutoReplies(
    activeProductId || undefined,
    Boolean(activeProductId),
  );

  const messages = autoReplies
    .filter((item) => item.parentId === null)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));

  function handleBack() {
    router.push("/bot-manager");
  }

  function handleAddMessage() {
    if (
      !activeProductId ||
      messages.length >= MAX_AUTO_REPLIES_PER_LEVEL ||
      isSaving ||
      isReordering
    ) {
      return;
    }

    setEditingAutoReplyId(null);
    setMessageDraft("");
    setAnswerDraft("");
    setIsAddingMessage(true);
  }

  function handleEditMessage(
    autoReplyId: string,
    message: string,
    answer: string,
  ) {
    if (isAddingMessage || isSaving || isReordering) {
      return;
    }

    setEditingAutoReplyId(autoReplyId);
    setMessageDraft(message);
    setAnswerDraft(answer);
    setIsAddingMessage(true);
  }

  function handleCancelAddMessage() {
    if (isSaving) {
      return;
    }

    setIsAddingMessage(false);
    setEditingAutoReplyId(null);
    setMessageDraft("");
    setAnswerDraft("");
  }

  function handleOpenDeleteConfirmation(autoReplyId: string, message: string) {
    setAutoReplyPendingDeletion({ id: autoReplyId, message });
  }

  function handleCloseDeleteConfirmation() {
    if (isDeleting) {
      return;
    }

    setAutoReplyPendingDeletion(null);
  }

  async function handleConfirmDeleteMessage() {
    if (!autoReplyPendingDeletion || isDeleting) {
      return;
    }

    const deleted = await deleteAutoReply(autoReplyPendingDeletion.id);

    if (deleted) {
      setAutoReplyPendingDeletion(null);
    }
  }

  async function handleSaveMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeProductId || !messageDraft.trim() || !answerDraft.trim()) {
      return;
    }

    const savedAutoReply = await saveAutoReply(
      {
        productId: activeProductId,
        message: messageDraft.trim(),
        answer: answerDraft.trim(),
      },
      editingAutoReplyId ?? undefined,
    );

    if (savedAutoReply) {
      setIsAddingMessage(false);
      setEditingAutoReplyId(null);
      setMessageDraft("");
      setAnswerDraft("");
    }
  }

  return (
    <main className="mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden p-5 sm:p-6">
      <section className="flex min-h-0 w-full flex-1 flex-col gap-6">
        <div className="flex shrink-0 items-center gap-3">
          <BackButton onClick={handleBack} ariaLabel="Back to Bot Manager" />

          {isProductSelectionMode && !product ? (
            <div className="min-w-0">
              <h1 className="text-base font-bold text-foreground">
                Add Auto Reply
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Select a product to add automatic reply messages and answers.
              </p>
            </div>
          ) : product ? (
            <>
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                <ProductImage
                  src={product.imageUrl ?? ""}
                  alt={product.name}
                  sizes="48px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-foreground">
                  {product.name}
                </h1>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {product.sku}
                </p>
              </div>
            </>
          ) : isLoadingProduct ? (
            <h1 className="text-base font-bold text-foreground">
              Loading product...
            </h1>
          ) : productError ? (
            <h1 role="alert" className="text-sm font-medium text-danger">
              {productError}
            </h1>
          ) : (
            <h1 className="text-base font-bold text-foreground">
              Product not found
            </h1>
          )}
        </div>

        {isProductSelectionMode && (
          <div className="max-w-5xl shrink-0 space-y-1">
            <FieldLabel htmlFor="auto-reply-product" required>
              Product
            </FieldLabel>
            <SelectField
              id="auto-reply-product"
              required
              value={selectedProductId}
              disabled={
                isAddingMessage ||
                isLoadingProducts ||
                availableProducts.length === 0
              }
              onChange={(event) => setSelectedProductId(event.target.value)}
              options={[
                {
                  value: "",
                  label: isLoadingProducts
                    ? "Loading products..."
                    : availableProducts.length > 0
                      ? "Select a product"
                      : "No products available",
                },
                ...availableProducts.map((item) => ({
                  value: item.id,
                  label: `${item.name} (${item.sku})`,
                })),
              ]}
            />
            {productLoadError && (
              <p role="alert" className="text-xs text-danger">
                {productLoadError}
              </p>
            )}
          </div>
        )}

        {product ? (
          <>
            <div className="shrink-0 border-b border-border" />

            <div className="shrink-0 space-y-1">
              <h2 className="text-sm font-bold text-foreground">
                Automatic Reply Messages
              </h2>
              <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
                Add messages and answers for common customer inquiries.
              </p>
            </div>

            <Card className="flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 p-4 sm:p-5">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
                <h3 className="text-sm font-bold text-foreground">Messages</h3>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary">
                    {messages.length}/{MAX_AUTO_REPLIES_PER_LEVEL} messages
                  </span>

                  <Button
                    variant="primary"
                    fullWidth={false}
                    type="button"
                    disabled={
                      messages.length >= MAX_AUTO_REPLIES_PER_LEVEL ||
                      isAddingMessage ||
                      isSaving ||
                      isLoadingAutoReplies
                    }
                    size="small"
                    onClick={handleAddMessage}
                  >
                    Add Message
                  </Button>
                </div>
              </div>

              {isLoadingAutoReplies ? (
                <p
                  role="status"
                  className="flex min-h-0 flex-1 items-center justify-center py-10 text-center text-xs text-muted-foreground"
                >
                  Loading automatic replies...
                </p>
              ) : autoRepliesError ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-10">
                  <p role="alert" className="text-center text-xs text-danger">
                    {autoRepliesError}
                  </p>
                  <Button
                    variant="secondary"
                    fullWidth={false}
                    type="button"
                    onClick={retryAutoReplies}
                  >
                    Try again
                  </Button>
                </div>
              ) : (
                <ol className="flex min-h-0 flex-1 flex-col divide-y divide-border/70 overflow-y-auto overscroll-contain pr-2">
                  {reorderError && (
                    <li className="py-2">
                      <p role="alert" className="text-xs text-danger">
                        {reorderError}
                      </p>
                    </li>
                  )}
                  {messages.length === 0 && !isAddingMessage && (
                    <li className="flex min-h-0 flex-1 items-center justify-center py-10 text-center text-xs font-medium text-muted-foreground">
                      No messages have been added for this product yet.
                    </li>
                  )}
                  {messages.map((message, index) => (
                    <li key={message.id} className="py-4 first:pt-0 last:pb-0">
                      <AutoReplyItem
                        reply={message}
                        index={index}
                        followUpCount={
                          autoReplies.filter(
                            (item) => item.parentId === message.id,
                          ).length
                        }
                        isFirst={index === 0}
                        isLast={index === messages.length - 1}
                        isDisabled={
                          isAddingMessage ||
                          isSaving ||
                          isDeleting ||
                          isReordering
                        }
                        onMove={(id, direction) =>
                          void moveAutoReply(id, direction)
                        }
                        onEdit={(reply) =>
                          handleEditMessage(
                            reply.id,
                            reply.message,
                            reply.answer,
                          )
                        }
                        onDelete={(reply) =>
                          handleOpenDeleteConfirmation(reply.id, reply.message)
                        }
                        onOpenFollowUps={(id) =>
                          router.push(`/bot-manager/${id}/follow-ups`)
                        }
                      />
                    </li>
                  ))}

                  {isAddingMessage && (
                    <li className="py-4">
                      <form onSubmit={handleSaveMessage} className="space-y-3">
                        <h3 className="text-sm font-bold text-foreground">
                          {editingAutoReplyId ? "Edit Message" : "New Message"}
                        </h3>
                        <div className="space-y-2">
                          <Input
                            autoFocus
                            required
                            maxLength={500}
                            value={messageDraft}
                            onChange={(event) =>
                              setMessageDraft(event.target.value)
                            }
                            placeholder="Enter a message..."
                            aria-label="New auto reply message"
                            disabled={isSaving}
                          />

                          <textarea
                            rows={4}
                            required
                            value={answerDraft}
                            onChange={(event) =>
                              setAnswerDraft(event.target.value)
                            }
                            placeholder="Enter an answer..."
                            aria-label="New auto reply answer"
                            disabled={isSaving}
                            className={`${fieldControlStyles} resize-y px-3.5 py-3 leading-relaxed`}
                          />
                        </div>

                        {actionError && (
                          <p role="alert" className="text-xs text-danger">
                            {actionError}
                          </p>
                        )}

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            fullWidth={false}
                            type="button"
                            size="small"
                            onClick={handleCancelAddMessage}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>

                          <Button
                            variant="primary"
                            fullWidth={false}
                            type="submit"
                            size="small"
                            disabled={
                              isSaving ||
                              !messageDraft.trim() ||
                              !answerDraft.trim()
                            }
                          >
                            {isSaving
                              ? "Saving..."
                              : editingAutoReplyId
                                ? "Save Changes"
                                : "Save"}
                          </Button>
                        </div>
                      </form>
                    </li>
                  )}
                </ol>
              )}

              {messages.length >= MAX_AUTO_REPLIES_PER_LEVEL && (
                <p className="shrink-0 border-t border-border/70 pt-3 text-[10px] text-muted-foreground">
                  Maximum of {MAX_AUTO_REPLIES_PER_LEVEL} messages reached.
                </p>
              )}
            </Card>
          </>
        ) : isProductSelectionMode ? (
          <Card className="flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center py-10 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              Select a product to view and manage its automatic reply messages.
            </p>
          </Card>
        ) : null}
      </section>

      <ConfirmationDialog
        open={Boolean(autoReplyPendingDeletion)}
        title="Delete message?"
        description={
          autoReplyPendingDeletion
            ? `Deleting "${autoReplyPendingDeletion.message}" will also permanently delete all of its follow-up messages.`
            : ""
        }
        confirmLabel="Delete Message"
        pendingLabel="Deleting..."
        variant="danger"
        icon={Trash2}
        isPending={isDeleting}
        error={deletionError}
        onConfirm={handleConfirmDeleteMessage}
        onCancel={handleCloseDeleteConfirmation}
      />
    </main>
  );
}
