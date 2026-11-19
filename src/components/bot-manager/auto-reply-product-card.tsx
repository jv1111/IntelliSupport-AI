import { Camera, DoorOpen, Router } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { BotProduct } from "./types";

interface AutoReplyProductCardProps {
  product: BotProduct;
  questionCount: number;
  onSelect: () => void;
}

const productIcons = {
  router: Router,
  camera: Camera,
  doorbell: DoorOpen,
};

export function AutoReplyProductCard({
  product,
  questionCount,
  onSelect,
}: AutoReplyProductCardProps) {
  const Icon = productIcons[product.visual];

  return (
    <Card variant="interactive" className="h-full">
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
      >
        <div className="flex h-36 items-center justify-center bg-linear-to-br from-primary/10 via-secondary/10 to-accent/10">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-white/70 bg-surface/80 text-primary shadow-sm">
            <Icon className="size-8" aria-hidden="true" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground">
              {product.name}
            </h3>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {product.model}
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary">
            {questionCount} {questionCount === 1 ? "question" : "questions"}
          </span>
        </div>
      </button>
    </Card>
  );
}
