import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const inputStyles =
  "w-full rounded-xl border border-border/60 bg-surface-muted py-3 text-xs font-medium text-foreground transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className = "", ...props }: InputProps) {
  return <input className={`${inputStyles} ${className}`.trim()} {...props} />;
}
