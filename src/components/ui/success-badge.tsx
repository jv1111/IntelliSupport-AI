import { CheckCircle2, type LucideIcon } from "lucide-react";

interface SuccessBadgeProps {
  label: string;
  icon?: LucideIcon;
}

export function SuccessBadge({
  label,
  icon: Icon = CheckCircle2,
}: SuccessBadgeProps) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
