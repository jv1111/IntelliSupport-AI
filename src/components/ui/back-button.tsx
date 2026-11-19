import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
}

export function BackButton({ onClick, ariaLabel, disabled }: BackButtonProps) {
  return (
    <Button
      variant="text"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground no-underline hover:bg-surface-muted hover:no-underline"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
    </Button>
  );
}
