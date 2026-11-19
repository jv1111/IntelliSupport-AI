import { ArrowDown, ArrowUp, GitBranch, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import type { AutoReply } from "./types";

interface AutoReplyQuestionCardProps {
  reply: AutoReply;
  index: number;
  total: number;
  followUpCount: number;
  onMove: (id: string, direction: -1 | 1) => void;
  onToggle: (id: string, checked: boolean) => void;
  onFollowUps: (id: string) => void;
  onEdit: (reply: AutoReply) => void;
  onDelete: (id: string) => void;
}

export function AutoReplyQuestionCard({
  reply,
  index,
  total,
  followUpCount,
  onMove,
  onToggle,
  onFollowUps,
  onEdit,
  onDelete,
}: AutoReplyQuestionCardProps) {
  return (
    <Card
      className={`flex items-start gap-3 rounded-xl p-4 shadow-sm ${
        reply.active ? "" : "opacity-60"
      }`}
    >
      <div className="flex shrink-0 flex-col items-center gap-1">
        <Button
          variant="icon"
          aria-label="Move question up"
          title="Move up"
          disabled={index === 0}
          onClick={() => onMove(reply.id, -1)}
          className="size-6!"
        >
          <ArrowUp className="size-3" aria-hidden="true" />
        </Button>

        <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
          {index + 1}
        </span>

        <Button
          variant="icon"
          aria-label="Move question down"
          title="Move down"
          disabled={index === total - 1}
          onClick={() => onMove(reply.id, 1)}
          className="size-6!"
        >
          <ArrowDown className="size-3" aria-hidden="true" />
        </Button>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-bold text-foreground">{reply.question}</p>

          <Toggle
            checked={reply.active}
            onCheckedChange={(checked) => onToggle(reply.id, checked)}
            label={`Toggle reply: ${reply.question}`}
            size="compact"
          />
        </div>

        <div className="flex items-start gap-2.5 rounded-lg bg-surface-muted p-3">
          <GitBranch
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {reply.answer}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="secondary"
            fullWidth={false}
            onClick={() => onFollowUps(reply.id)}
            className="gap-2 px-3 py-2 text-[11px]"
          >
            <GitBranch className="size-3.5" aria-hidden="true" />
            Follow-ups
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
              {followUpCount}/3
            </span>
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="icon"
              aria-label="Edit question"
              title="Edit"
              onClick={() => onEdit(reply)}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </Button>

            <Button
              variant="danger-subtle"
              fullWidth={false}
              aria-label="Delete question"
              title="Delete"
              onClick={() => onDelete(reply.id)}
              className="size-9! rounded-full! p-0!"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
