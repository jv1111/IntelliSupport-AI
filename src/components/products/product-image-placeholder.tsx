import { Package } from "lucide-react";

export function ProductImagePlaceholder() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden bg-linear-to-br from-primary/10 via-surface-muted to-secondary/10">
      <div
        className="absolute -top-8 -left-8 size-28 rounded-full bg-primary/15 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="absolute -right-8 -bottom-8 size-28 rounded-full bg-secondary/15 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative flex size-14 items-center justify-center rounded-2xl bg-surface text-primary shadow-sm inset-ring-1 inset-ring-border transition-transform duration-300 group-hover:scale-110">
        <Package className="size-7 stroke-[1.5]" aria-hidden="true" />
      </div>

      <span className="relative text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
        No image
      </span>
    </div>
  );
}
