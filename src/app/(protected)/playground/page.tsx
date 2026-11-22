import { Suspense } from "react";
import { PageLoadingFallback } from "@/components/layout/page-loading-fallback";
import { Playground } from "@/components/playground/playground";

export default function PlaygroundPage() {
  return (
    <Suspense
      fallback={<PageLoadingFallback message="Loading playground..." />}
    >
      <Playground />
    </Suspense>
  );
}
