import Link from "next/link";
import type { ComponentProps } from "react";

type PrimaryActionLinkProps = ComponentProps<typeof Link>;

const primaryActionLinkStyles =
  "inline-flex items-center justify-center rounded-xl bg-linear-to-r from-primary to-secondary p-3 text-xs font-bold tracking-wider text-primary-foreground transition-all duration-150 ease-out hover:scale-[1.01] hover:from-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15";

export function PrimaryActionLink({
  className = "",
  ...props
}: PrimaryActionLinkProps) {
  return (
    <Link
      {...props}
      className={`${primaryActionLinkStyles} ${className}`.trim()}
    />
  );
}
