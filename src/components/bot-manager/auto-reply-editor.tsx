"use client";

import { AutoReplyForm } from "@/components/bot-manager/auto-reply-form";
import { useAutoReplyEditor } from "@/components/bot-manager/hooks/use-auto-reply-editor";

export function AutoReplyEditor() {
  const form = useAutoReplyEditor();

  return (
    <main className="mx-auto flex min-h-full w-full flex-col gap-6 p-6 sm:p-8">
      <AutoReplyForm
        title={form.title}
        values={form.values}
        products={form.products}
        groups={form.groups}
        isFollowUp={form.isFollowUp}
        parentQuestion={form.parentQuestion}
        error={form.error}
        onChange={form.onChange}
        onSubmit={form.onSubmit}
        onCancel={form.onCancel}
      />
    </main>
  );
}
