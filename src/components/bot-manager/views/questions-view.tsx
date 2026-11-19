import { ArrowDown, ArrowUp, Layers, Plus, Trash2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { AutoReplyQuestionCard } from "@/components/bot-manager/auto-reply-question-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { AutoReply, AutoReplyGroup } from "@/components/bot-manager/types";
import type { Product } from "@/lib/products/types";

interface QuestionsViewReply {
  reply: AutoReply;
  followUpCount: number;
}

interface QuestionsViewGroup {
  group: AutoReplyGroup;
  replies: QuestionsViewReply[];
  isFull: boolean;
}

interface QuestionsViewProps {
  product: Product;
  groups: QuestionsViewGroup[];
  maxGroupQuestions: number;
  onBack: () => void;
  onAddGroup: () => void;
  onMoveGroup: (id: string, direction: -1 | 1) => void;
  onAddQuestion: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onMoveReply: (id: string, direction: -1 | 1) => void;
  onToggleReply: (id: string, checked: boolean) => void;
  onFollowUps: (parentId: string) => void;
  onEditReply: (reply: AutoReply) => void;
  onDeleteReply: (id: string) => void;
}

export function QuestionsView({
  product,
  groups,
  maxGroupQuestions,
  onBack,
  onAddGroup,
  onMoveGroup,
  onAddQuestion,
  onDeleteGroup,
  onMoveReply,
  onToggleReply,
  onFollowUps,
  onEditReply,
  onDeleteReply,
}: QuestionsViewProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <BackButton onClick={onBack} ariaLabel="Back to products" />

          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground">
              {product.name}
            </h2>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {product.sku}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          fullWidth={false}
          onClick={onAddGroup}
          className="gap-2 px-4 py-2.5 text-xs"
        >
          <Layers className="size-3.5" aria-hidden="true" />
          Add Group
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Arrange the order with the arrows. Groups and their questions appear to
        customers in this order, with up to {maxGroupQuestions} selectable
        questions per group.
      </p>

      {groups.length > 0 ? (
        <div className="space-y-5">
          {groups.map(
            ({ group, replies: groupReplies, isFull }, groupIndex) => (
              <Card
                key={group.id}
                className="space-y-4 rounded-2xl bg-surface-muted/30 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex shrink-0 flex-col">
                      <Button
                        variant="icon"
                        aria-label="Move group up"
                        disabled={groupIndex === 0}
                        onClick={() => onMoveGroup(group.id, -1)}
                        className="h-5! w-6!"
                      >
                        <ArrowUp className="size-3" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="icon"
                        aria-label="Move group down"
                        disabled={groupIndex === groups.length - 1}
                        onClick={() => onMoveGroup(group.id, 1)}
                        className="h-5! w-6!"
                      >
                        <ArrowDown className="size-3" aria-hidden="true" />
                      </Button>
                    </div>

                    <Layers
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />

                    <h3 className="min-w-0 truncate text-sm font-bold text-foreground">
                      {group.name}
                    </h3>

                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        isFull
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-border bg-surface text-muted-foreground"
                      }`}
                    >
                      {groupReplies.length}/{maxGroupQuestions}
                      {isFull ? " Full" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      fullWidth={false}
                      disabled={isFull}
                      onClick={() => onAddQuestion(group.id)}
                      className="gap-1.5 px-3 py-2 text-[11px]"
                    >
                      <Plus className="size-3" aria-hidden="true" />
                      Add Question
                    </Button>

                    <Button
                      variant="danger-subtle"
                      fullWidth={false}
                      aria-label="Delete group"
                      title="Delete group"
                      onClick={() => onDeleteGroup(group.id)}
                      className="size-9! rounded-full! p-0!"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {groupReplies.length > 0 ? (
                  <div className="space-y-3">
                    {groupReplies.map(({ reply, followUpCount }, index) => (
                      <AutoReplyQuestionCard
                        key={reply.id}
                        reply={reply}
                        index={index}
                        total={groupReplies.length}
                        followUpCount={followUpCount}
                        onMove={onMoveReply}
                        onToggle={onToggleReply}
                        onFollowUps={onFollowUps}
                        onEdit={onEditReply}
                        onDelete={onDeleteReply}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Layers}
                    title="This group is empty"
                    description="Add a question to start building automatic replies."
                  />
                )}
              </Card>
            ),
          )}
        </div>
      ) : (
        <EmptyState
          variant="card"
          icon={Layers}
          title="No groups yet"
          description="Create a group to organize this product's automatic replies."
          action={
            <Button
              fullWidth={false}
              onClick={onAddGroup}
              className="mt-4 gap-2 px-4 py-2.5 text-xs"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add Group
            </Button>
          }
        />
      )}
    </>
  );
}
