import type { ReactNode } from "react";

export type InlineBadgeVariant = "primary" | "warning";

interface InlineBadgeProps {
  children: ReactNode;
  variant: InlineBadgeVariant;
}

const variantStyles: Record<InlineBadgeVariant, string> = {
  primary: "bg-primary/10 text-primary",
  warning: "bg-danger/10 text-danger",
};

export function InlineBadge({ children, variant }: InlineBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
