"use client";

import { useEffect, useRef } from "react";

export function useAutoScroll<T extends HTMLElement>(
  trigger: unknown,
  behavior: ScrollBehavior = "smooth",
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || container.scrollHeight <= container.clientHeight) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  }, [trigger, behavior]);

  return containerRef;
}
