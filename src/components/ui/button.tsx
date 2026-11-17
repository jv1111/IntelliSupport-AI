import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "danger-subtle"
  | "icon-surface"
  | "text"
  | "icon"
  | "tab";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  active?: boolean;
}

const baseStyles =
  "inline-flex items-center justify-center font-bold tracking-wider focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 disabled:opacity-60";

const animatedStyles =
  "transition-all duration-150 ease-out hover:scale-[1.01] active:scale-[0.99] disabled:hover:scale-100 disabled:active:scale-100";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "rounded-xl bg-linear-to-r from-primary to-secondary text-xs text-primary-foreground   hover:from-primary-hover hover:to-secondary",

  secondary:
    "rounded-xl bg-surface text-xs text-foreground inset-ring-1 inset-ring-border hover:bg-surface-muted",

  danger: "rounded-xl bg-danger text-xs text-white   hover:bg-danger/90",

  "danger-subtle":
    "rounded-xl bg-danger/5 text-xs text-danger inset-ring-1 inset-ring-danger/30 hover:bg-danger/10",

  text: "rounded-sm text-[11px] text-primary hover:text-primary-hover hover:underline",

  icon: "size-8 rounded-md text-muted-foreground hover:text-foreground",

  "icon-surface":
    "size-9 shrink-0 rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-foreground",

  tab: "text-xs",
};

export function Button({
  variant = "primary",
  fullWidth = variant === "primary" || variant === "secondary",
  active = false,
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  const stateStyles =
    variant === "tab"
      ? active
        ? "text-primary"
        : "text-muted-foreground hover:text-foreground"
      : "";

  const isIconVariant = variant === "icon" || variant === "icon-surface";
  const paddingStyles = isIconVariant ? "p-0" : "p-3";
  const widthStyles = isIconVariant ? "" : fullWidth ? "w-full" : "w-auto";
  const transitionStyles =
    variant === "tab" || variant === "icon-surface"
      ? "transition-colors"
      : animatedStyles;

  return (
    <button
      type={type}
      className={`${baseStyles} ${paddingStyles} ${widthStyles} ${transitionStyles} ${variantStyles[variant]} ${stateStyles} ${className}`.trim()}
      {...props}
    />
  );
}
