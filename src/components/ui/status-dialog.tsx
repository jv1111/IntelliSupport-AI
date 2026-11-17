"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type StatusDialogStatus = "loading" | "success" | "error";

interface StatusDialogProps {
  open: boolean;
  status: StatusDialogStatus;
  title: string;
  message: string;
  actionLabel?: string;
  onClose: () => void;
}

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const statusStyles: Record<StatusDialogStatus, string> = {
  loading: "bg-primary/10 text-primary",
  success: "bg-primary/10 text-primary",
  error: "bg-danger/10 text-danger",
};

function subscribeToPortalContainer() {
  return () => {};
}

function getPortalContainer() {
  return document.body;
}

function getServerPortalContainer() {
  return null;
}

export function StatusDialog({
  open,
  status,
  title,
  message,
  actionLabel = "Close",
  onClose,
}: StatusDialogProps) {
  const portalContainer = useSyncExternalStore(
    subscribeToPortalContainer,
    getPortalContainer,
    getServerPortalContainer,
  );
  const dialogId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !portalContainer) {
      return;
    }

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const initialFocus =
      dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]");

    (initialFocus ?? dialogRef.current)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();

        if (status !== "loading") {
          onClose();
        }

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements =
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector);

      if (!focusableElements?.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (previousActiveElement?.isConnected) {
        previousActiveElement.focus();
      }
    };
  }, [open, portalContainer, status, onClose]);

  if (!open || !portalContainer) {
    return null;
  }

  const StatusIcon =
    status === "loading"
      ? LoaderCircle
      : status === "success"
        ? CheckCircle2
        : AlertCircle;

  const isLoading = status === "loading";

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        disabled={isLoading}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />

      <Card
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-description`}
        tabIndex={-1}
        className="relative w-full max-w-sm space-y-5 p-6"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${statusStyles[status]}`}
          >
            <StatusIcon
              className={`size-5 ${isLoading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <h2
              id={`${dialogId}-title`}
              className="text-base font-bold text-foreground"
            >
              {title}
            </h2>

            <p
              id={`${dialogId}-description`}
              role={status === "error" ? "alert" : "status"}
              aria-live={status === "error" ? "assertive" : "polite"}
              className="mt-1 text-xs leading-relaxed text-muted-foreground"
            >
              {message}
            </p>
          </div>
        </div>

        {!isLoading && (
          <div className="flex justify-end">
            <Button
              type="button"
              fullWidth={false}
              data-autofocus
              onClick={onClose}
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </Card>
    </div>,
    portalContainer,
  );
}
