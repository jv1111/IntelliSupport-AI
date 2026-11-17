"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormikInput } from "@/components/ui/formik-input";

type PasswordFormikInputProps = Omit<
  ComponentProps<typeof FormikInput>,
  "type" | "trailingAction"
>;

export function PasswordFormikInput(props: PasswordFormikInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <FormikInput
      {...props}
      type={isVisible ? "text" : "password"}
      trailingAction={
        <Button
          variant="icon"
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </Button>
      }
    />
  );
}
