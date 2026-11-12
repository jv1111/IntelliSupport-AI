import type { ComponentPropsWithRef } from "react";

type CardVariant = "default" | "interactive";

type CardProps = ComponentPropsWithRef<"div"> & {
  variant?: CardVariant;
};

const cardStyles: Record<CardVariant, string> = {
  default:
    "rounded-3xl border border-border/70 bg-surface shadow-xl shadow-foreground/5",
  interactive:
    "group overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-foreground/5",
};

export function Card({
  variant = "default",
  className = "",
  ...props
}: CardProps) {
  return (
    <div className={`${cardStyles[variant]} ${className}`.trim()} {...props} />
  );
}
