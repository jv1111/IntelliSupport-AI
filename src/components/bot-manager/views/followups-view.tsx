import { Layers } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { AutoReplyQuestionCard } from "@/components/bot-manager/auto-reply-question-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { AutoReply } from "@/components/bot-manager/types";

interface FollowupsViewItem {
  reply: AutoReply;
  followUpCount: number;
}

interface FollowupsViewProps {
  parent: AutoReply;
  productName: string;
  followUps: FollowupsViewItem[];
  maxFollowUps: number;
  onBack: () => void;
  onAddFollowUp: () => void;
  onMoveReply: (id: string, direction: -1 | 1) => void;
  onToggleReply: (id: string, checked: boolean) => void;
  onFollowUps: (parentId: string) => void;
  onEditReply: (reply: AutoReply) => void;
  onDeleteReply: (id: string) => void;
}

export function FollowupsView({
  parent,
  productName,
  followUps,
  maxFollowUps,
  onBack,
  onAddFollowUp,
  onMoveReply,
  onToggleReply,
  onFollowUps,
  onEditReply,
  onDeleteReply,
}: FollowupsViewProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <BackButton onClick={onBack} ariaLabel="Back to questions" />

          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {productName}
            </p>
            <h2 className="truncate text-base font-bold text-foreground">
              Follow-ups for &quot;{parent.question}&quot;
            </h2>
          </div>
        </div>

        <Button
          fullWidth={false}
          disabled={followUps.length >= maxFollowUps}
          onClick={onAddFollowUp}
          className="gap-2 px-4 py-2.5 text-xs"
        >
          Add Follow-up
        </Button>
      </div>

      <Card className="w-full max-w-4xl space-y-2 rounded-xl bg-surface-muted p-4 shadow-none">
        <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Answer sent first
        </p>
        <p className="text-xs leading-relaxed text-foreground">
          {parent.answer}
        </p>
      </Card>

      <p className="text-xs text-muted-foreground">
        After this answer, customers can choose from these follow-up questions (
        {followUps.length}/{maxFollowUps}).
      </p>

      {followUps.length > 0 ? (
        <div className="w-full space-y-3">
          {followUps.map(({ reply, followUpCount }, index) => (
            <AutoReplyQuestionCard
              key={reply.id}
              reply={reply}
              index={index}
              total={followUps.length}
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
          variant="card"
          icon={Layers}
          title="No follow-ups yet"
          description="Add a follow-up question to give customers more options."
        />
      )}
    </>
  );
}
