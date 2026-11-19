import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewBackButtonProps {
  onClick: () => void;
  ariaLabel: string;
}

export function ViewBackButton({ onClick, ariaLabel }: ViewBackButtonProps) {
  return (
    <Button
      variant="text"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground no-underline hover:bg-surface-muted hover:no-underline"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
    </Button>
  );
}
