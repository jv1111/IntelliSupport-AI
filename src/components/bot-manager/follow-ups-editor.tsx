"use client";

import { useRouter } from "next/navigation";
import { AutoReplyItem } from "@/components/bot-manager/auto-reply-item";
import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { useBotManagerAutoReplies } from "@/components/bot-manager/hooks/use-bot-manager-auto-replies";
import { useBotManagerProduct } from "@/components/bot-manager/hooks/use-bot-manager-product";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(
    null,
  );
  const [followUpPendingDeletion, setFollowUpPendingDeletion] = useState<{
    id: string;
    question: string;
  } | null>(null);

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
  } = useBotManagerAutoReplies();

  const parentReply = autoReplies.find((item) => item.id === questionId);

  const {
    product,
    isLoading: isLoadingProduct,
    error: productError,
  } = useBotManagerProduct(parentReply?.productId);

  const followUps = autoReplies
    .filter((item) => item.parentId === questionId)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));

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
      isSaving ||
      isDeleting ||
      isReordering
    ) {
      return;
    }

    setEditingFollowUpId(null);
    setFollowUpDraft("");
    setAnswerDraft("");
    setIsAddingFollowUp(true);
  }

  function handleEditFollowUp(
    followUpId: string,
    question: string,
    answer: string,
  ) {
    if (isAddingFollowUp || isSaving || isDeleting || isReordering) {
      return;
    }

    setEditingFollowUpId(followUpId);
    setFollowUpDraft(question);
    setAnswerDraft(answer);
    setIsAddingFollowUp(true);
  }

  function handleCancelAddFollowUp() {
    if (isSaving || isDeleting) {
      return;
    }

    setIsAddingFollowUp(false);
    setEditingFollowUpId(null);
    setFollowUpDraft("");
    setAnswerDraft("");
  }

  function handleOpenDeleteConfirmation(followUpId: string, question: string) {
    setFollowUpPendingDeletion({ id: followUpId, question });
  }

  function handleCloseDeleteConfirmation() {
    if (isDeleting) {
      return;
    }

    setFollowUpPendingDeletion(null);
  }

  async function handleConfirmDeleteFollowUp() {
    if (!followUpPendingDeletion || isDeleting) {
      return;
    }

    const deleted = await deleteAutoReply(followUpPendingDeletion.id);

    if (deleted) {
      setFollowUpPendingDeletion(null);
    }
  }

  async function handleSaveFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!parentReply || !followUpDraft.trim() || !answerDraft.trim()) {
      return;
    }

    const savedAutoReply = await saveAutoReply(
      {
        productId: parentReply.productId,
        parentId: parentReply.id,
        question: followUpDraft.trim(),
        answer: answerDraft.trim(),
      },
      editingFollowUpId ?? undefined,
    );

    if (savedAutoReply) {
      setIsAddingFollowUp(false);
      setEditingFollowUpId(null);
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
                isSaving ||
                isDeleting ||
                isReordering
              }
              size="small"
              onClick={handleAddFollowUp}
            >
              Add Follow-up
            </Button>
          </div>

          {reorderError && (
            <p role="alert" className="text-xs text-danger">
              {reorderError}
            </p>
          )}

          {followUps.length > 0 || isAddingFollowUp ? (
            <ol className="space-y-3">
              {followUps.map((followUp, index) => {
                const childCount = autoReplies.filter(
                  (item) => item.parentId === followUp.id,
                ).length;

                return (
                  <li key={followUp.id}>
                    <Card className="space-y-4 p-4 sm:p-5">
                      <AutoReplyItem
                        reply={followUp}
                        index={index}
                        followUpCount={childCount}
                        isFirst={index === 0}
                        isLast={index === followUps.length - 1}
                        isDisabled={
                          isAddingFollowUp ||
                          isSaving ||
                          isDeleting ||
                          isReordering
                        }
                        onMove={(id, direction) =>
                          void moveAutoReply(id, direction)
                        }
                        onEdit={(reply) =>
                          handleEditFollowUp(
                            reply.id,
                            reply.question,
                            reply.answer,
                          )
                        }
                        onDelete={(reply) =>
                          handleOpenDeleteConfirmation(reply.id, reply.question)
                        }
                        onOpenFollowUps={(id) =>
                          router.push(`/bot-manager/${id}/follow-ups`)
                        }
                      />
                    </Card>
                  </li>
                );
              })}

              {isAddingFollowUp && (
                <li>
                  <Card className="space-y-3 p-4 sm:p-5">
                    <form onSubmit={handleSaveFollowUp} className="space-y-3">
                      <h3 className="text-sm font-bold text-foreground">
                        {editingFollowUpId ? "Edit Follow-up" : "New Follow-up"}
                      </h3>

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
                          size="small"
                          onClick={handleCancelAddFollowUp}
                          disabled={isSaving || isDeleting}
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
                            !followUpDraft.trim() ||
                            !answerDraft.trim()
                          }
                        >
                          {isSaving
                            ? editingFollowUpId
                              ? "Updating..."
                              : "Saving..."
                            : "Save"}
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

      <ConfirmationDialog
        open={Boolean(followUpPendingDeletion)}
        title="Delete follow-up question?"
        description={
          followUpPendingDeletion
            ? `Deleting "${followUpPendingDeletion.question}" will also permanently delete all of its nested follow-up questions.`
            : ""
        }
        confirmLabel="Delete Follow-up"
        pendingLabel="Deleting..."
        variant="danger"
        icon={Trash2}
        isPending={isDeleting}
        error={deletionError}
        onConfirm={handleConfirmDeleteFollowUp}
        onCancel={handleCloseDeleteConfirmation}
      />
    </main>
  );
}
