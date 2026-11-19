interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  size?: "default" | "compact";
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  checked,
  onCheckedChange,
  label,
  size = "default",
  disabled = false,
  className = "",
}: ToggleProps) {
  const isCompact = size === "compact";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        isCompact ? "h-5 w-9" : "h-7 w-12"
      } ${checked ? "bg-primary" : "bg-border"} ${className}`.trim()}
    >
      <span
        className={`absolute rounded-full bg-white shadow-sm transition-transform ${
          isCompact ? "left-0.5 size-4" : "left-1 size-5"
        } ${
          checked
            ? isCompact
              ? "translate-x-3.5"
              : "translate-x-5"
            : "translate-x-0"
        }`}
      />
    </button>
  );
}
