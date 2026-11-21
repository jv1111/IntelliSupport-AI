"use client";

import { ArrowDown, ArrowUp, GitBranch, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_AUTO_REPLIES_PER_LEVEL } from "@/lib/auto-replies/constants";
import type {
  AutoReply,
  AutoReplyMoveDirection,
} from "@/lib/auto-replies/types";

interface AutoReplyItemProps {
  reply: AutoReply;
  index: number;
  followUpCount: number;
  isFirst: boolean;
  isLast: boolean;
  isDisabled: boolean;
  onMove: (id: string, direction: AutoReplyMoveDirection) => void;
  onEdit: (reply: AutoReply) => void;
  onDelete: (reply: AutoReply) => void;
  onOpenFollowUps: (id: string) => void;
}

export function AutoReplyItem({
  reply,
  index,
  followUpCount,
  isFirst,
  isLast,
  isDisabled,
  onMove,
  onEdit,
  onDelete,
  onOpenFollowUps,
}: AutoReplyItemProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-sm font-bold text-foreground">
            {reply.question}
          </p>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="icon"
              type="button"
              aria-label={`Move ${reply.question} up`}
              title="Move up"
              className="text-muted-foreground! hover:text-primary!"
              disabled={isFirst || isDisabled}
              onClick={() => onMove(reply.id, "UP")}
            >
              <ArrowUp className="size-3.5" aria-hidden="true" />
            </Button>

            <Button
              variant="icon"
              type="button"
              aria-label={`Move ${reply.question} down`}
              title="Move down"
              className="text-muted-foreground! hover:text-primary!"
              disabled={isLast || isDisabled}
              onClick={() => onMove(reply.id, "DOWN")}
            >
              <ArrowDown className="size-3.5" aria-hidden="true" />
            </Button>

            <Button
              variant="icon"
              type="button"
              aria-label={`Edit ${reply.question}`}
              title="Edit question"
              className="text-primary! hover:text-primary-hover!"
              disabled={isDisabled}
              onClick={() => onEdit(reply)}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </Button>

            <Button
              variant="icon"
              type="button"
              aria-label={`Delete ${reply.question}`}
              title="Delete question"
              className="text-danger! hover:text-danger/80!"
              disabled={isDisabled}
              onClick={() => onDelete(reply)}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="rounded-xl bg-surface-muted p-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {reply.answer}
          </p>
        </div>

        <Button
          variant="primary-subtle"
          fullWidth={false}
          type="button"
          className="gap-2 px-3 py-2"
          disabled={isDisabled}
          onClick={() => onOpenFollowUps(reply.id)}
        >
          <GitBranch className="size-3.5" aria-hidden="true" />
          Add Follow-ups
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold">
            {followUpCount}/{MAX_AUTO_REPLIES_PER_LEVEL}
          </span>
        </Button>
      </div>
    </div>
  );
}
