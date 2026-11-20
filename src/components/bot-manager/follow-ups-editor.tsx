"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, GitBranch, Pencil, Trash2 } from "lucide-react";
import { useBotManagerProduct } from "@/components/bot-manager/hooks/use-bot-manager-product";
import { useBotManagerQuestions } from "@/components/bot-manager/hooks/use-bot-manager-questions";
import { findBotManagerQuestion } from "@/components/bot-manager/question-editor-data";

import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fieldControlStyles } from "@/components/ui/field";

interface FollowUpsEditorProps {
  questionId: string;
}

export function FollowUpsEditor({ questionId }: FollowUpsEditorProps) {
  const router = useRouter();
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(
    null,
  );
  const [followUpDraft, setFollowUpDraft] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");
  const [newFollowUpId, setNewFollowUpId] = useState<string | null>(null);

  const {
    questions,
    addFollowUp,
    removeQuestion,
    moveQuestion,
    updateQuestion,
  } = useBotManagerQuestions();

  const match = findBotManagerQuestion(questionId, questions);
  const {
    product,
    isLoading: isLoadingProduct,
    error: productError,
  } = useBotManagerProduct(match?.productId);

  if (!match || isLoadingProduct || !product) {
    return (
      <main className="min-h-full p-5 sm:p-6">
        <section className="space-y-6">
          <BackButton
            onClick={() => router.push("/bot-manager")}
            ariaLabel="Back to Bot Manager"
          />
          <div>
            <h1 className="text-sm font-bold text-foreground">
              {isLoadingProduct
                ? "Loading product..."
                : productError
                  ? "Unable to load product"
                  : "Follow-up question not found"}
            </h1>
            {productError && (
              <p role="alert" className="mt-1 text-xs text-danger">
                {productError}
              </p>
            )}
          </div>
        </section>
      </main>
    );
  }

  const followUps = match.question.followUps ?? [];
  const followUpLimit = 3;

  function handleAddFollowUp() {
    const followUp = addFollowUp(questionId);

    if (!followUp) {
      return;
    }

    setFollowUpDraft("");
    setAnswerDraft("");
    setNewFollowUpId(followUp.id);
    setEditingFollowUpId(followUp.id);
  }

  function handleCancelEdit(followUpId: string) {
    if (newFollowUpId === followUpId) {
      removeQuestion(followUpId);
    }

    setEditingFollowUpId(null);
    setNewFollowUpId(null);
  }

  return (
    <main className="min-h-full p-5 sm:p-6">
      <section className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <BackButton
            onClick={() =>
              router.push(
                match.parentId
                  ? `/bot-manager/${match.parentId}/follow-ups`
                  : `/bot-manager/${match.productId}/question-editor`,
              )
            }
            ariaLabel="Back to previous questions"
          />

          <div className="min-w-0 space-y-1">
            <p className="truncate text-xs font-bold text-foreground">
              {product.name}
            </p>
            <h1 className="text-sm font-bold text-foreground">
              Follow-ups for {match.question.question}
            </h1>
          </div>
        </div>

        <div className="border-b border-border" />

        <section className="max-w-5xl space-y-2">
          <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Answer sent first
          </p>
          <div className="rounded-2xl border border-border/70 bg-surface-muted p-4">
            <p className="text-xs leading-relaxed text-foreground">
              {match.question.answer}
            </p>
          </div>
        </section>

        <section className="max-w-5xl space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
              After this answer, customers can pick one of these follow-up
              questions ({followUps.length}/{followUpLimit}). Use the arrows to
              arrange the order.
            </p>

            <Button
              variant="primary"
              fullWidth={false}
              type="button"
              disabled={
                followUps.length >= followUpLimit || editingFollowUpId !== null
              }
              className="gap-2 px-3 py-2"
              onClick={handleAddFollowUp}
            >
              Add Follow-up
            </Button>
          </div>

          {followUps.length > 0 ? (
            <ol className="space-y-3">
              {followUps.map((followUp, index) => (
                <li key={followUp.id}>
                  <Card className="space-y-4 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          {editingFollowUpId === followUp.id ? (
                            <div className="min-w-0 flex-1 space-y-2">
                              <Input
                                autoFocus
                                value={followUpDraft}
                                onChange={(event) =>
                                  setFollowUpDraft(event.target.value)
                                }
                                placeholder="Enter a follow-up question..."
                                aria-label="Edit follow-up question"
                              />

                              <textarea
                                rows={4}
                                value={answerDraft}
                                onChange={(event) =>
                                  setAnswerDraft(event.target.value)
                                }
                                placeholder="Enter an answer..."
                                aria-label="Edit follow-up answer"
                                className={`${fieldControlStyles} resize-y px-3.5 py-3 leading-relaxed`}
                              />

                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="secondary"
                                  fullWidth={false}
                                  type="button"
                                  className="px-3 py-2"
                                  onClick={() => handleCancelEdit(followUp.id)}
                                >
                                  Cancel
                                </Button>

                                <Button
                                  variant="primary"
                                  fullWidth={false}
                                  type="button"
                                  className="px-3 py-2"
                                  disabled={
                                    !followUpDraft.trim() || !answerDraft.trim()
                                  }
                                  onClick={() => {
                                    updateQuestion(
                                      followUp.id,
                                      followUpDraft.trim(),
                                      answerDraft.trim(),
                                    );
                                    setEditingFollowUpId(null);
                                    setNewFollowUpId(null);
                                  }}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-bold text-foreground">
                                {followUp.question}
                              </p>

                              <div className="flex shrink-0 items-center gap-1">
                                <Button
                                  variant="icon-surface"
                                  type="button"
                                  aria-label={`Move follow-up ${index + 1} up`}
                                  title="Move up"
                                  disabled={index === 0}
                                  onClick={() =>
                                    moveQuestion(followUp.id, "up")
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
                                  aria-label={`Move follow-up ${index + 1} down`}
                                  title="Move down"
                                  disabled={index === followUps.length - 1}
                                  onClick={() =>
                                    moveQuestion(followUp.id, "down")
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
                                  aria-label={`Edit follow-up ${index + 1}`}
                                  title="Edit follow-up"
                                  onClick={() => {
                                    setFollowUpDraft(followUp.question);
                                    setAnswerDraft(followUp.answer);
                                    setNewFollowUpId(null);
                                    setEditingFollowUpId(followUp.id);
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
                                  aria-label={`Delete follow-up ${index + 1}`}
                                  title="Delete follow-up"
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

                        {editingFollowUpId === followUp.id ? null : (
                          <div className="rounded-xl bg-surface-muted p-3">
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {followUp.answer}
                            </p>
                          </div>
                        )}

                        <Button
                          variant="primary-subtle"
                          fullWidth={false}
                          type="button"
                          className="gap-2 px-3 py-2"
                          onClick={() =>
                            router.push(
                              `/bot-manager/${followUp.id}/follow-ups`,
                            )
                          }
                        >
                          <GitBranch className="size-3.5" aria-hidden="true" />
                          Add Follow-ups
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold">
                            {followUp.followUps?.length ?? 0}/{followUpLimit}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          ) : (
            <Card className="py-10 text-center">
              <p className="text-xs font-medium text-muted-foreground">
                No follow-up questions have been added yet.
              </p>
            </Card>
          )}
        </section>
      </section>
    </main>
  );
}
