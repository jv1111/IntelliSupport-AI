"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, GitBranch, Pencil, Trash2 } from "lucide-react";
import { useBotManagerProduct } from "@/components/bot-manager/hooks/use-bot-manager-product";
import { useBotManagerProducts } from "@/components/bot-manager/hooks/use-bot-manager-products";
import { useBotManagerQuestions } from "@/components/bot-manager/hooks/use-bot-manager-questions";
import { ProductImage } from "@/components/products/product-image";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldLabel, fieldControlStyles } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";
interface QuestionEditorProps {
  productId?: string;
}

export function QuestionEditor({ productId }: QuestionEditorProps) {
  const isProductSelectionMode = productId === undefined;
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState(productId ?? "");

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

  const {
    questions: questionsByProduct,
    addQuestion,
    removeQuestion,
    moveQuestion,
    updateQuestion,
  } = useBotManagerQuestions();
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [questionDraft, setQuestionDraft] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");
  const [newQuestionId, setNewQuestionId] = useState<string | null>(null);

  const activeProductId = productId ?? selectedProductId;
  const product = isProductSelectionMode
    ? availableProducts.find((item) => item.id === activeProductId)
    : routeProduct;
  const questions = questionsByProduct[activeProductId] ?? [];
  const questionLimit = 3;
  const followUpLimit = 3;

  function handleBack() {
    router.push("/bot-manager");
  }

  function handleAddQuestion() {
    if (!activeProductId) {
      return;
    }

    const question = addQuestion(activeProductId);

    if (!question) {
      return;
    }

    setQuestionDraft("");
    setAnswerDraft("");
    setNewQuestionId(question.id);
    setEditingQuestionId(question.id);
  }

  function handleCancelEdit(questionId: string) {
    if (newQuestionId === questionId) {
      removeQuestion(questionId);
    }

    setEditingQuestionId(null);
    setNewQuestionId(null);
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
                editingQuestionId !== null ||
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
                Arrange questions in the order customers should see them. You
                can add follow-up questions to provide more detailed answers to
                common customer inquiries.
              </p>
            </div>

            <Card className="max-w-5xl space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
                <h3 className="text-sm font-bold text-foreground">Questions</h3>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary">
                    {questions.length}/{questionLimit} questions
                  </span>

                  <Button
                    variant="primary"
                    fullWidth={false}
                    type="button"
                    disabled={
                      questions.length >= questionLimit ||
                      editingQuestionId !== null
                    }
                    className="gap-2 px-3 py-2"
                    onClick={handleAddQuestion}
                  >
                    Add Question
                  </Button>
                </div>
              </div>

              {questions.length > 0 ? (
                <ol className="divide-y divide-border/70">
                  {questions.map((question, index) => (
                    <li key={question.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            {editingQuestionId === question.id ? (
                              <div className="min-w-0 flex-1 space-y-2">
                                <Input
                                  autoFocus
                                  value={questionDraft}
                                  onChange={(event) =>
                                    setQuestionDraft(event.target.value)
                                  }
                                  placeholder="Enter a question..."
                                  aria-label="Edit question"
                                />

                                <textarea
                                  rows={4}
                                  value={answerDraft}
                                  onChange={(event) =>
                                    setAnswerDraft(event.target.value)
                                  }
                                  placeholder="Enter an answer..."
                                  aria-label="Edit answer"
                                  className={`${fieldControlStyles} resize-y px-3.5 py-3 leading-relaxed`}
                                />

                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="secondary"
                                    fullWidth={false}
                                    type="button"
                                    className="px-3 py-2"
                                    onClick={() =>
                                      handleCancelEdit(question.id)
                                    }
                                  >
                                    Cancel
                                  </Button>

                                  <Button
                                    variant="primary"
                                    fullWidth={false}
                                    type="button"
                                    className="px-3 py-2"
                                    disabled={
                                      !questionDraft.trim() ||
                                      !answerDraft.trim()
                                    }
                                    onClick={() => {
                                      updateQuestion(
                                        question.id,
                                        questionDraft.trim(),
                                        answerDraft.trim(),
                                      );
                                      setEditingQuestionId(null);
                                      setNewQuestionId(null);
                                    }}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-bold text-foreground">
                                  {question.question}
                                </p>

                                <div className="flex shrink-0 items-center gap-1">
                                  <Button
                                    variant="icon-surface"
                                    type="button"
                                    aria-label={`Move question ${index + 1} up`}
                                    title="Move up"
                                    disabled={index === 0}
                                    onClick={() =>
                                      moveQuestion(question.id, "up")
                                    }
                                  >
                                    <ArrowUp
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  </Button>

                                  <Button
                                    variant="icon-surface"
                                    type="button"
                                    aria-label={`Move question ${index + 1} down`}
                                    title="Move down"
                                    disabled={index === questions.length - 1}
                                    onClick={() =>
                                      moveQuestion(question.id, "down")
                                    }
                                  >
                                    <ArrowDown
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  </Button>

                                  <Button
                                    variant="icon-surface"
                                    className="text-primary!"
                                    type="button"
                                    aria-label={`Edit question ${index + 1}`}
                                    title="Edit question"
                                    onClick={() => {
                                      setQuestionDraft(question.question);
                                      setAnswerDraft(question.answer);
                                      setNewQuestionId(null);
                                      setEditingQuestionId(question.id);
                                    }}
                                  >
                                    <Pencil
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  </Button>

                                  <Button
                                    variant="icon-surface"
                                    className="text-danger!"
                                    type="button"
                                    aria-label={`Delete question ${index + 1}`}
                                    title="Delete question"
                                  >
                                    <Trash2
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="rounded-xl bg-surface-muted p-3">
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {question.answer}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="primary-subtle"
                              fullWidth={false}
                              type="button"
                              className="gap-2 px-3 py-2"
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
                              Add Follow-ups{" "}
                              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold">
                                {question.followUps?.length ?? 0}/
                                {followUpLimit}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-10 text-center text-xs font-medium text-muted-foreground">
                  No questions have been added for this product yet.
                </p>
              )}

              {questions.length >= questionLimit && (
                <p className="border-t border-border/70 pt-3 text-[10px] text-muted-foreground">
                  Maximum of {questionLimit} questions reached.
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
    </main>
  );
}
