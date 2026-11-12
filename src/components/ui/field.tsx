import type { LabelHTMLAttributes } from "react";

interface FieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const labelStyles = "mb-1.5 block text-xs font-bold text-foreground";

export const fieldControlStyles =
  "w-full rounded-xl border border-border/60 bg-surface-muted text-xs text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-60";

export function FieldLabel({
  required = false,
  className = "",
  children,
  ...props
}: FieldLabelProps) {
  return (
    <label className={`${labelStyles} ${className}`.trim()} {...props}>
      {children}
      {required && (
        <span className="text-danger" aria-hidden="true">
          {" "}
          *
        </span>
      )}
    </label>
  );
}
