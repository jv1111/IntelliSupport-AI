import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function PageHeader({
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-base font-bold text-foreground">{title}</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {action && (
        <Button fullWidth={false} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
