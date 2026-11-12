"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import type { LucideIcon } from "lucide-react";

function subscribeToPortalContainer() {
  return () => {};
}

function getPortalContainer() {
  return document.body;
}

function getServerPortalContainer() {
  return null;
}

type ConfirmationDialogVariant = "primary" | "danger";

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationDialogVariant;
  icon?: LucideIcon;
  isPending?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const variantStyles: Record<
  ConfirmationDialogVariant,
  { icon: string; confirmButton: string }
> = {
  primary: {
    icon: "bg-primary/10 text-primary",
    confirmButton:
      "bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary-hover",
  },
  danger: {
    icon: "bg-danger/10 text-danger",
    confirmButton: "bg-danger text-white shadow-danger/20 hover:bg-danger/90",
  },
};

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel = "Processing...",
  cancelLabel = "Cancel",
  variant = "primary",
  icon: Icon,
  isPending = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const portalContainer = useSyncExternalStore(
    subscribeToPortalContainer,
    getPortalContainer,
    getServerPortalContainer,
  );
  const dialogId = useId();
  const dialogRef = useRef<HTMLElement>(null);

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

        if (!isPending) {
          onCancel();
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
  }, [open, portalContainer, isPending, onCancel]);

  if (!open || !portalContainer) {
    return null;
  }

  const styles = variantStyles[variant];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close confirmation dialog"
        disabled={isPending}
        onClick={onCancel}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-description`}
        tabIndex={-1}
        className="relative w-full max-w-sm space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3.5">
          {Icon ? (
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
            >
              <Icon className="size-5" aria-hidden="true" />
            </div>
          ) : null}

          <div>
            <h2
              id={`${dialogId}-title`}
              className="text-base font-bold text-foreground"
            >
              {title}
            </h2>
            <p
              id={`${dialogId}-description`}
              className="mt-1 text-xs leading-relaxed text-muted-foreground"
            >
              {description}
            </p>
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-xs font-medium text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            data-autofocus
            disabled={isPending}
            onClick={onCancel}
            className="rounded-xl bg-surface-muted px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-border disabled:opacity-60"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-semibold shadow-md transition-colors disabled:opacity-60 ${styles.confirmButton}`}
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    portalContainer,
  );
}
