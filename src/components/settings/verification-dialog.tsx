"use client";

import { createPortal } from "react-dom";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type VerificationMethod = "email" | "phone";

interface VerificationDialogProps {
  open: boolean;
  method: VerificationMethod;
  destination: string;
  onClose: () => void;
}

function subscribeToPortalContainer() {
  return () => {};
}

function getPortalContainer() {
  return document.body;
}

function getServerPortalContainer() {
  return null;
}

const cooldownDuration = 60;

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function VerificationDialog({
  open,
  method,
  destination,
  onClose,
}: VerificationDialogProps) {
  const portalContainer = useSyncExternalStore(
    subscribeToPortalContainer,
    getPortalContainer,
    getServerPortalContainer,
  );
  const dialogId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const title =
    method === "email" ? "Verify email address" : "Verify phone number";

  const handleClose = useCallback(() => {
    setCode(Array(6).fill(""));
    setError(null);
    setFeedback(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [cooldown]);

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
        handleClose();
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
  }, [open, portalContainer, handleClose]);

  function handleResend() {
    setCooldown(cooldownDuration);
    setError(null);
    setFeedback("This is a frontend preview. No verification code was sent.");
  }

  function focusCodeInput(index: number) {
    dialogRef.current
      ?.querySelector<HTMLInputElement>(`[id="${dialogId}-code-${index}"]`)
      ?.focus();
  }

  function handleCodeChange(index: number, value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6 - index);

    setError(null);
    setFeedback(null);

    if (!digits) {
      setCode((current) =>
        current.map((digit, position) => (position === index ? "" : digit)),
      );
      return;
    }

    setCode((current) => {
      const updated = [...current];

      digits.split("").forEach((digit, offset) => {
        updated[index + offset] = digit;
      });

      return updated;
    });

    const nextIndex = Math.min(index + digits.length, 5);
    focusCodeInput(nextIndex);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!code.every((digit) => /^\d$/.test(digit))) {
      setError("Enter a valid 6-digit verification code.");
      setFeedback(null);
      return;
    }

    setError(null);
    setFeedback(
      "Code submitted in frontend preview. No verification was performed.",
    );
  }

  if (!open || !portalContainer) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close verification dialog"
        onClick={handleClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />

      <Card
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-description`}
        tabIndex={-1}
        className="relative w-full max-w-sm space-y-6 p-6"
      >
        <div className="flex items-start justify-between gap-4">
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
              Enter the 6-digit verification code for {destination}.
            </p>
          </div>

          <Button
            variant="icon"
            type="button"
            onClick={handleClose}
            aria-label="Close verification dialog"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <FieldLabel htmlFor={`${dialogId}-code-0`}>
              Verification code
            </FieldLabel>

            <div
              className="grid grid-cols-6 gap-2"
              role="group"
              aria-label="Six-digit verification code"
            >
              {code.map((digit, index) => (
                <Input
                  key={index}
                  id={`${dialogId}-code-${index}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={6}
                  value={digit}
                  onChange={(event) =>
                    handleCodeChange(index, event.target.value)
                  }
                  onPaste={(event) => {
                    event.preventDefault();
                    handleCodeChange(
                      index,
                      event.clipboardData.getData("text"),
                    );
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !digit && index > 0) {
                      event.preventDefault();
                      setCode((current) =>
                        current.map((value, position) =>
                          position === index - 1 ? "" : value,
                        ),
                      );
                      focusCodeInput(index - 1);
                    } else if (event.key === "ArrowLeft" && index > 0) {
                      event.preventDefault();
                      focusCodeInput(index - 1);
                    } else if (event.key === "ArrowRight" && index < 5) {
                      event.preventDefault();
                      focusCodeInput(index + 1);
                    }
                  }}
                  data-autofocus={index === 0}
                  aria-label={`Digit ${index + 1} of 6`}
                  aria-invalid={Boolean(error)}
                  aria-describedby={`${dialogId}-hint`}
                  className="h-12 min-w-0 px-0 text-center text-lg font-semibold tracking-normal"
                  required
                />
              ))}
            </div>

            <p
              id={`${dialogId}-hint`}
              className="mt-1.5 text-xs text-muted-foreground"
            >
              Enter the six-digit code.
            </p>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-danger">
              {error}
            </p>
          )}

          {feedback && (
            <p role="status" className="text-xs text-muted-foreground">
              {feedback}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="text"
              fullWidth={false}
              disabled={cooldown > 0}
              onClick={handleResend}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </Button>

            <Button
              type="submit"
              fullWidth={false}
              disabled={!code.every(Boolean)}
            >
              Submit
            </Button>
          </div>
        </form>
      </Card>
    </div>,
    portalContainer,
  );
}
