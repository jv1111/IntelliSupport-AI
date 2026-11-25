"use client";

import { useRouter } from "next/navigation";
import { Form, Formik, type FormikHelpers } from "formik";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordFormikInput } from "@/components/ui/password-formik-input";
import { resetPassword } from "@/lib/auth/forgot-password";
import {
  validateResetPassword,
  type ResetPasswordFormValues,
} from "@/lib/validations/forgot-password";

const initialValues: ResetPasswordFormValues = {
  newPassword: "",
  confirmPassword: "",
};

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();

  async function handleSubmit(
    values: ResetPasswordFormValues,
    { setStatus }: FormikHelpers<ResetPasswordFormValues>,
  ): Promise<void> {
    setStatus(undefined);

    try {
      const succeeded = await resetPassword(token, {
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      if (!succeeded) {
        setStatus("Unable to reset your password. Please try again.");
        return;
      }

      router.replace("/auth");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to reset your password. Please try again.",
      );
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      validate={validateResetPassword}
      onSubmit={handleSubmit}
    >
      {({ status, isSubmitting }) => (
        <Card className="p-8 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LockKeyhole className="size-7" aria-hidden="true" />
            </div>
            <h1 className="brand-gradient-text text-2xl font-extrabold tracking-tight">
              Set a new password
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed font-medium text-muted-foreground">
              Choose a new password for your IntelliSupport account.
            </p>
          </div>

          <Form className="space-y-5" noValidate>
            <PasswordFormikInput
              name="newPassword"
              label="New password"
              autoComplete="new-password"
              placeholder="Enter your new password"
              leadingIcon={LockKeyhole}
            />

            <PasswordFormikInput
              name="confirmPassword"
              label="Confirm new password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              leadingIcon={LockKeyhole}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>

            {typeof status === "string" && (
              <p
                className="text-center text-xs text-muted-foreground"
                role="status"
              >
                {status}
              </p>
            )}
          </Form>
        </Card>
      )}
    </Formik>
  );
}
