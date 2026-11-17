import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type EmptyStateVariant = "compact" | "card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  variant?: EmptyStateVariant;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "compact",
}: EmptyStateProps) {
  if (variant === "card") {
    return (
      <Card className="flex min-h-72 flex-1 flex-col items-center justify-center border-dashed px-6 py-12 text-center shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </div>

        <h2 className="mt-4 text-sm font-bold text-foreground">{title}</h2>

        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>

        {action}
      </Card>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
      <Icon
        className="mx-auto size-6 text-muted-foreground"
        aria-hidden="true"
      />

      <p className="mt-2 text-sm font-medium text-foreground">{title}</p>

      <p className="mt-1 text-xs text-muted-foreground">{description}</p>

      {action}
    </div>
  );
}
