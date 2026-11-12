import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "text" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const baseStyles =
  "inline-flex items-center justify-center font-bold tracking-wider transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100 disabled:active:scale-100";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "w-full rounded-xl bg-linear-to-r from-primary to-secondary py-3.5 text-xs text-primary-foreground shadow-lg shadow-primary/20 hover:from-primary-hover hover:to-secondary",

  secondary:
    "w-full rounded-xl border border-border/70 bg-surface py-3 text-xs text-muted shadow-xs hover:bg-background hover:text-foreground",

  text: "rounded-sm text-[11px] text-primary hover:text-primary-hover hover:underline",

  icon: "size-8 rounded-md text-muted-foreground hover:text-foreground",
};

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
