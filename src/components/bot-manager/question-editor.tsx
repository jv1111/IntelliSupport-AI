"use client";

import { useRouter } from "next/navigation";
import { GitBranch, Trash2 } from "lucide-react";
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
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [questionPendingDeletion, setQuestionPendingDeletion] = useState<{
    id: string;
    question: string;
  } | null>(null);
  const [questionDraft, setQuestionDraft] = useState("");
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
    actionError,
    deletionError,
    saveAutoReply,
    deleteAutoReply,
    retry: retryAutoReplies,
  } = useBotManagerAutoReplies(
    activeProductId || undefined,
    Boolean(activeProductId),
  );

  const questions = autoReplies.filter((item) => item.parentId === null);

  function handleBack() {
    router.push("/bot-manager");
  }

  function handleAddQuestion() {
    if (
      !activeProductId ||
      questions.length >= MAX_AUTO_REPLIES_PER_LEVEL ||
      isSaving
    ) {
      return;
    }

    setEditingQuestionId(null);
    setQuestionDraft("");
    setAnswerDraft("");
    setIsAddingQuestion(true);
  }

  function handleEditQuestion(
    questionId: string,
    question: string,
    answer: string,
  ) {
    if (isAddingQuestion || isSaving) {
      return;
    }

    setEditingQuestionId(questionId);
    setQuestionDraft(question);
    setAnswerDraft(answer);
    setIsAddingQuestion(true);
  }

  function handleCancelAddQuestion() {
    if (isSaving) {
      return;
    }

    setIsAddingQuestion(false);
    setEditingQuestionId(null);
    setQuestionDraft("");
    setAnswerDraft("");
  }

  function handleOpenDeleteConfirmation(
    questionId: string,
    question: string,
  ) {
    setQuestionPendingDeletion({ id: questionId, question });
  }

  function handleCloseDeleteConfirmation() {
    if (isDeleting) {
      return;
    }

    setQuestionPendingDeletion(null);
  }

  async function handleConfirmDeleteQuestion() {
    if (!questionPendingDeletion || isDeleting) {
      return;
    }

    const deleted = await deleteAutoReply(questionPendingDeletion.id);

    if (deleted) {
      setQuestionPendingDeletion(null);
    }
  }

  async function handleSaveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeProductId || !questionDraft.trim() || !answerDraft.trim()) {
      return;
    }

    const savedAutoReply = await saveAutoReply(
      {
        productId: activeProductId,
        question: questionDraft.trim(),
        answer: answerDraft.trim(),
      },
      editingQuestionId ?? undefined,
    );

    if (savedAutoReply) {
      setIsAddingQuestion(false);
      setEditingQuestionId(null);
      setQuestionDraft("");
      setAnswerDraft("");
    }
  }

  return (
    <main className="min-h-full p-5 sm:p-6">
      <section className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <BackButton onClick={handleBack} ariaLabel="Back to Bot Manager" />

          {isProductSelectionMode && !product ? (
            <div className="min-w-0">
              <h1 className="text-base font-bold text-foreground">
                Add Auto Reply
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Select a product to add automatic reply questions and answers.
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
          <div className="max-w-5xl space-y-1">
            <FieldLabel htmlFor="auto-reply-product" required>
              Product
            </FieldLabel>
            <SelectField
              id="auto-reply-product"
              required
              value={selectedProductId}
              disabled={
                isAddingQuestion ||
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
            <div className="border-b border-border" />

            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground">
                Automatic Reply Questions
              </h2>
              <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
                Add questions and answers for common customer inquiries.
              </p>
            </div>

            <Card className="max-w-5xl space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
                <h3 className="text-sm font-bold text-foreground">Questions</h3>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary">
                    {questions.length}/{MAX_AUTO_REPLIES_PER_LEVEL} questions
                  </span>

                  <Button
                    variant="primary"
                    fullWidth={false}
                    type="button"
                    disabled={
                      questions.length >= MAX_AUTO_REPLIES_PER_LEVEL ||
                      isAddingQuestion ||
                      isSaving ||
                      isLoadingAutoReplies
                    }
                    className="gap-2 px-3 py-2"
                    onClick={handleAddQuestion}
                  >
                    Add Question
                  </Button>
                </div>
              </div>

              {isLoadingAutoReplies ? (
                <p
                  role="status"
                  className="py-10 text-center text-xs text-muted-foreground"
                >
                  Loading automatic replies...
                </p>
              ) : autoRepliesError ? (
                <div className="flex flex-col items-center gap-3 py-10">
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
                <ol className="divide-y divide-border/70">
                  {questions.map((question, index) => (
                    <li key={question.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-bold text-foreground">
                              {question.question}
                            </p>

                            <div className="flex shrink-0 items-center gap-2">
                              <Button
                                variant="secondary"
                                fullWidth={false}
                                type="button"
                                className="px-3 py-2"
                                disabled={isAddingQuestion || isSaving || isDeleting}
                                onClick={() =>
                                  handleEditQuestion(
                                    question.id,
                                    question.question,
                                    question.answer,
                                  )
                                }
                              >
                                Edit
                              </Button>

                              <Button
                                variant="secondary"
                                fullWidth={false}
                                type="button"
                                className="px-3 py-2 text-danger"
                                disabled={isAddingQuestion || isSaving || isDeleting}
                                onClick={() =>
                                  handleOpenDeleteConfirmation(
                                    question.id,
                                    question.question,
                                  )
                                }
                              >
                                Delete
                              </Button>
                            </div>
                          </div>

                          <div className="rounded-xl bg-surface-muted p-3">
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {question.answer}
                            </p>
                          </div>

                          <Button
                            variant="primary-subtle"
                            fullWidth={false}
                            type="button"
                            className="gap-2 px-3 py-2"
                            disabled={isAddingQuestion || isSaving || isDeleting}
                            onClick={() =>
                              router.push(
                                `/bot-manager/${question.id}/follow-ups`,
                              )
                            }
                          >
                            <GitBranch
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Add Follow-ups
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}

                  {isAddingQuestion && (
                    <li className="py-4">
                      <form onSubmit={handleSaveQuestion} className="space-y-3">
                        <h3 className="text-sm font-bold text-foreground">
                          {editingQuestionId ? "Edit Question" : "New Question"}
                        </h3>
                        <div className="space-y-2">
                          <Input
                            autoFocus
                            required
                            maxLength={500}
                            value={questionDraft}
                            onChange={(event) =>
                              setQuestionDraft(event.target.value)
                            }
                            placeholder="Enter a question..."
                            aria-label="New auto reply question"
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
                            className="px-3 py-2"
                            onClick={handleCancelAddQuestion}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>

                          <Button
                            variant="primary"
                            fullWidth={false}
                            type="submit"
                            className="px-3 py-2"
                            disabled={
                              isSaving ||
                              !questionDraft.trim() ||
                              !answerDraft.trim()
                            }
                          >
                            {isSaving
                              ? "Saving..."
                              : editingQuestionId
                                ? "Save Changes"
                                : "Save"}
                          </Button>
                        </div>
                      </form>
                    </li>
                  )}
                </ol>
              )}

              {!isLoadingAutoReplies &&
                !autoRepliesError &&
                questions.length === 0 &&
                !isAddingQuestion && (
                  <p className="py-10 text-center text-xs font-medium text-muted-foreground">
                    No questions have been added for this product yet.
                  </p>
                )}

              {questions.length >= MAX_AUTO_REPLIES_PER_LEVEL && (
                <p className="border-t border-border/70 pt-3 text-[10px] text-muted-foreground">
                  Maximum of {MAX_AUTO_REPLIES_PER_LEVEL} questions reached.
                </p>
              )}
            </Card>
          </>
        ) : isProductSelectionMode ? (
          <Card className="max-w-5xl py-10 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              Select a product to view and manage its automatic reply questions.
            </p>
          </Card>
        ) : null}
      </section>

      <ConfirmationDialog
        open={Boolean(questionPendingDeletion)}
        title="Delete question?"
        description={
          questionPendingDeletion
            ? `Deleting "${questionPendingDeletion.question}" will also permanently delete all of its follow-up questions.`
            : ""
        }
        confirmLabel="Delete Question"
        pendingLabel="Deleting..."
        variant="danger"
        icon={Trash2}
        isPending={isDeleting}
        error={deletionError}
        onConfirm={handleConfirmDeleteQuestion}
        onCancel={handleCloseDeleteConfirmation}
      />
    </main>
  );
}
