import type { FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldLabel, fieldControlStyles } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AutoReplyFormValues, AutoReplyGroup, BotProduct } from "./types";

interface AutoReplyFormProps {
  title: string;
  values: AutoReplyFormValues;
  products: BotProduct[];
  groups: AutoReplyGroup[];
  isFollowUp: boolean;
  parentQuestion: string | null;
  error: string;
  onChange: (field: keyof AutoReplyFormValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export function AutoReplyForm({
  title,
  values,
  products,
  groups,
  isFollowUp,
  parentQuestion,
  error,
  onChange,
  onSubmit,
  onCancel,
}: AutoReplyFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="icon-surface"
            aria-label="Go back"
            onClick={onCancel}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Button>

          <div>
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Create an instant answer for a common customer question.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            fullWidth={false}
            onClick={onCancel}
            className="px-4 py-2.5 text-xs"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            fullWidth={false}
            className="gap-2 px-4 py-2.5 text-xs"
          >
            <Save className="size-3.5" aria-hidden="true" />
            Save Auto Reply
          </Button>
        </div>
      </div>

      <Card className="w-full max-w-4xl space-y-6 p-5 sm:p-6">
        {isFollowUp && (
          <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary/5 p-3.5">
            <div>
              <p className="text-xs font-bold text-primary">
                Follow-up question
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Shown after the answer to: {parentQuestion}
              </p>
            </div>
          </div>
        )}

        {!isFollowUp && (
          <>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="bot-product" required>
                Associated Product
              </FieldLabel>

              <select
                id="bot-product"
                required
                value={values.productId}
                onChange={(event) => onChange("productId", event.target.value)}
                className={`${fieldControlStyles} px-3.5 py-2.5`}
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.model})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="bot-group" required>
                Group
              </FieldLabel>

              <select
                id="bot-group"
                required
                value={values.groupId}
                onChange={(event) => onChange("groupId", event.target.value)}
                className={`${fieldControlStyles} px-3.5 py-2.5 sm:max-w-md`}
              >
                <option value="">Select a group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
                <option value="NEW">+ Create new group</option>
              </select>

              <p className="text-[10px] text-muted-foreground">
                A group can contain up to 3 customer questions.
              </p>
            </div>

            {values.groupId === "NEW" && (
              <div className="space-y-1.5">
                <FieldLabel htmlFor="bot-new-group">New Group Name</FieldLabel>
                <Input
                  id="bot-new-group"
                  value={values.newGroupName}
                  onChange={(event) =>
                    onChange("newGroupName", event.target.value)
                  }
                  placeholder="e.g. Setup Help"
                  className="px-3.5 py-2.5 sm:max-w-md"
                />
              </div>
            )}
          </>
        )}

        <div className="space-y-1.5">
          <FieldLabel htmlFor="bot-question" required>
            Customer Question
          </FieldLabel>

          <Input
            id="bot-question"
            required
            value={values.question}
            onChange={(event) => onChange("question", event.target.value)}
            placeholder="e.g. How long is the warranty?"
            className="px-3.5 py-2.5"
          />

          <p className="text-[10px] text-muted-foreground">
            When a customer asks something similar, the answer below is sent
            instantly.
          </p>
        </div>

        <div className="space-y-1.5">
          <FieldLabel htmlFor="bot-answer" required>
            Instant Answer
          </FieldLabel>

          <textarea
            id="bot-answer"
            required
            rows={5}
            value={values.answer}
            onChange={(event) => onChange("answer", event.target.value)}
            placeholder="e.g. All our products come with a 1-year manufacturer warranty..."
            className={`${fieldControlStyles} resize-y p-3.5 leading-relaxed`}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-xs text-danger"
          >
            {error}
          </p>
        )}
      </Card>
    </form>
  );
}
