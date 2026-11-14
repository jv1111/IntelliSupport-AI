import type { ProductStatus } from "@/generated/prisma/enums";

type StatusBadgeStatus = ProductStatus;

interface StatusBadgeProps {
  status: StatusBadgeStatus;
  className?: string;
}

const statusStyles: Record<StatusBadgeStatus, string> = {
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${statusStyles[status]} ${className}`.trim()}
    >
      {status}
    </span>
  );
}
