import type { ProductStatus } from "@/generated/prisma/enums";

type StatusBadgeStatus = ProductStatus | "enabled" | "disabled";
type StatusBadgeVariant = "default" | "pill";

interface StatusBadgeProps {
  status: StatusBadgeStatus;
  variant?: StatusBadgeVariant;
  label?: string;
  className?: string;
}

const statusStyles: Record<StatusBadgeStatus, string> = {
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
  enabled: "border-emerald-200 bg-emerald-50 text-emerald-700",
  disabled: "border-border bg-surface-muted text-muted-foreground",
};

const variantStyles: Record<StatusBadgeVariant, string> = {
  default: "rounded-lg px-2.5 py-1 tracking-wide uppercase",
  pill: "rounded-full px-2 py-0.5",
};

export function StatusBadge({
  status,
  variant = "default",
  label,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`border text-[10px] font-bold ${variantStyles[variant]} ${statusStyles[status]} ${className}`.trim()}
    >
      {label ?? status}
    </span>
  );
}
