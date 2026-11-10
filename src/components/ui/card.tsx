import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

const cardStyles =
  "rounded-3xl border border-border/70 bg-surface shadow-xl shadow-foreground/5";

export function Card({ className = "", ...props }: CardProps) {
  return <div className={`${cardStyles} ${className}`.trim()} {...props} />;
}
