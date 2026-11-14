"use client";

import { useEffect } from "react";

interface ElementRef {
  readonly current: Element | null;
}

interface UseInfiniteScrollOptions {
  rootRef?: ElementRef | null;
  targetRef: ElementRef;
  enabled: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}

export function useInfiniteScroll({
  rootRef,
  targetRef,
  enabled,
  onLoadMore,
  rootMargin = "200px 0px",
}: UseInfiniteScrollOptions) {
  useEffect(() => {
    const target = targetRef.current;

    if (!enabled || !target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      {
        root: rootRef?.current ?? null,
        rootMargin,
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [enabled, onLoadMore, rootMargin, rootRef, targetRef]);
}
