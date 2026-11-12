"use client";

import { useField } from "formik";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field";
import type { LucideIcon } from "lucide-react";

interface FormikInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name"
> {
  name: string;
  label: string;
  leadingIcon?: LucideIcon;
  trailingAction?: ReactNode;
}

export function FormikInput({
  name,
  label,
  leadingIcon: LeadingIcon,
  trailingAction,
  className = "",
  id = name,
  ...props
}: FormikInputProps) {
  const [field, meta] = useField(name);
  const error = meta.touched ? meta.error : undefined;
  const errorId = `${id}-error`;

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      <div className="group relative">
        {LeadingIcon && (
          <LeadingIcon
            aria-hidden="true"
            className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary"
          />
        )}

        <Input
          {...field}
          {...props}
          id={id}
          className={[
            LeadingIcon && "pl-10",
            trailingAction && "pr-10",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />

        {trailingAction && (
          <div className="absolute top-1/2 right-3.5 -translate-y-1/2">
            {trailingAction}
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
