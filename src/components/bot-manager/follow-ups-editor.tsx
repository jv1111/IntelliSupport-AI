"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GitBranch } from "lucide-react";
import { useBotManagerAutoReplies } from "@/components/bot-manager/hooks/use-bot-manager-auto-replies";
import { useBotManagerProduct } from "@/components/bot-manager/hooks/use-bot-manager-product";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fieldControlStyles } from "@/components/ui/field";
import { MAX_AUTO_REPLIES_PER_LEVEL } from "@/lib/auto-replies/constants";

interface FollowUpsEditorProps {
  questionId: string;
}

export function FollowUpsEditor({ questionId }: FollowUpsEditorProps) {
  const router = useRouter();

  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [followUpDraft, setFollowUpDraft] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");

  const {
    autoReplies,
    isLoading: isLoadingAutoReplies,
    error: autoRepliesError,
    isSaving,
    actionError,
    addAutoReply,
    retry: retryAutoReplies,
  } = useBotManagerAutoReplies();

  const parentReply = autoReplies.find((item) => item.id === questionId);

  const {
    product,
    isLoading: isLoadingProduct,
    error: productError,
  } = useBotManagerProduct(parentReply?.productId);

  const followUps = autoReplies
    .filter((item) => item.parentId === questionId)
    .sort((a, b) => a.position - b.position);

  function handleBack() {
    if (!parentReply) {
      router.push("/bot-manager");
      return;
    }

    router.push(
      parentReply.parentId
        ? `/bot-manager/${parentReply.parentId}/follow-ups`
        : `/bot-manager/${parentReply.productId}/question-editor`,
    );
  }

  function handleAddFollowUp() {
    if (
      !parentReply ||
      followUps.length >= MAX_AUTO_REPLIES_PER_LEVEL ||
      isSaving
    ) {
      return;
    }

    setFollowUpDraft("");
    setAnswerDraft("");
    setIsAddingFollowUp(true);
  }

  function handleCancelAddFollowUp() {
    if (isSaving) {
      return;
    }

    setIsAddingFollowUp(false);
    setFollowUpDraft("");
    setAnswerDraft("");
  }

  async function handleSaveFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!parentReply || !followUpDraft.trim() || !answerDraft.trim()) {
      return;
    }

    const createdAutoReply = await addAutoReply({
      productId: parentReply.productId,
      parentId: parentReply.id,
      question: followUpDraft.trim(),
      answer: answerDraft.trim(),
    });

    if (createdAutoReply) {
      setIsAddingFollowUp(false);
      setFollowUpDraft("");
      setAnswerDraft("");
    }
  }

  if (isLoadingAutoReplies) {
    return (
      <main className="min-h-full p-5 sm:p-6">
        <section className="space-y-6">
          <BackButton
            onClick={handleBack}
            ariaLabel="Back to previous questions"
          />
          <p role="status" className="text-xs text-muted-foreground">
            Loading automatic replies...
          </p>
        </section>
      </main>
    );
  }

  if (autoRepliesError) {
    return (
      <main className="min-h-full p-5 sm:p-6">
        <section className="space-y-4">
          <BackButton
            onClick={handleBack}
            ariaLabel="Back to previous questions"
          />
          <p role="alert" className="text-xs text-danger">
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
        </section>
      </main>
    );
  }

  if (!parentReply) {
    return (
      <main className="min-h-full p-5 sm:p-6">
        <section className="space-y-6">
          <BackButton onClick={handleBack} ariaLabel="Back to Bot Manager" />
          <h1 className="text-sm font-bold text-foreground">
            Follow-up question not found
          </h1>
        </section>
      </main>
    );
  }

  if (isLoadingProduct) {
    return (
      <main className="min-h-full p-5 sm:p-6">
        <section className="space-y-6">
          <BackButton
            onClick={handleBack}
            ariaLabel="Back to previous questions"
          />
          <p role="status" className="text-xs text-muted-foreground">
            Loading product...
          </p>
        </section>
      </main>
    );
  }

  if (!product || productError) {
    return (
      <main className="min-h-full p-5 sm:p-6">
        <section className="space-y-6">
          <BackButton
            onClick={handleBack}
            ariaLabel="Back to previous questions"
          />
          <h1 role="alert" className="text-sm font-bold text-danger">
            {productError ?? "Unable to load product."}
          </h1>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-full p-5 sm:p-6">
      <section className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <BackButton
            onClick={handleBack}
            ariaLabel="Back to previous questions"
          />

          <div className="min-w-0 space-y-1">
            <p className="truncate text-xs font-bold text-foreground">
              {product.name}
            </p>
            <h1 className="text-sm font-bold text-foreground">
              Follow-ups for {parentReply.question}
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
              {parentReply.answer}
            </p>
          </div>
        </section>

        <section className="max-w-5xl space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
              After this answer, customers can pick one of these follow-up
              questions ({followUps.length}/{MAX_AUTO_REPLIES_PER_LEVEL}).
            </p>

            <Button
              variant="primary"
              fullWidth={false}
              type="button"
              disabled={
                followUps.length >= MAX_AUTO_REPLIES_PER_LEVEL ||
                isAddingFollowUp ||
                isSaving
              }
              className="gap-2 px-3 py-2"
              onClick={handleAddFollowUp}
            >
              Add Follow-up
            </Button>
          </div>

          {followUps.length > 0 || isAddingFollowUp ? (
            <ol className="space-y-3">
              {followUps.map((followUp, index) => {
                const childCount = autoReplies.filter(
                  (item) => item.parentId === followUp.id,
                ).length;

                return (
                  <li key={followUp.id}>
                    <Card className="space-y-4 p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1 space-y-3">
                          <p className="text-sm font-bold text-foreground">
                            {followUp.question}
                          </p>

                          <div className="rounded-xl bg-surface-muted p-3">
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {followUp.answer}
                            </p>
                          </div>

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
                            <GitBranch
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Add Follow-ups
                            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold">
                              {childCount}/{MAX_AUTO_REPLIES_PER_LEVEL}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}

              {isAddingFollowUp && (
                <li>
                  <Card className="space-y-3 p-4 sm:p-5">
                    <form onSubmit={handleSaveFollowUp} className="space-y-3">
                      <Input
                        autoFocus
                        required
                        maxLength={500}
                        value={followUpDraft}
                        onChange={(event) =>
                          setFollowUpDraft(event.target.value)
                        }
                        placeholder="Enter a follow-up question..."
                        aria-label="New follow-up question"
                        disabled={isSaving}
                      />

                      <textarea
                        rows={4}
                        required
                        value={answerDraft}
                        onChange={(event) => setAnswerDraft(event.target.value)}
                        placeholder="Enter an answer..."
                        aria-label="New follow-up answer"
                        disabled={isSaving}
                        className={`${fieldControlStyles} resize-y px-3.5 py-3 leading-relaxed`}
                      />

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
                          onClick={handleCancelAddFollowUp}
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
                            !followUpDraft.trim() ||
                            !answerDraft.trim()
                          }
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </form>
                  </Card>
                </li>
              )}
            </ol>
          ) : (
            <Card className="py-10 text-center">
              <p className="text-xs font-medium text-muted-foreground">
                No follow-up questions have been added yet.
              </p>
            </Card>
          )}

          {followUps.length >= MAX_AUTO_REPLIES_PER_LEVEL && (
            <p className="border-t border-border/70 pt-3 text-[10px] text-muted-foreground">
              Maximum of {MAX_AUTO_REPLIES_PER_LEVEL} follow-up questions
              reached.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
