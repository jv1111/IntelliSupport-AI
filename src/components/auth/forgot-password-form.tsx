"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Formik, type FormikHelpers } from "formik";
import { KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormikInput } from "@/components/ui/formik-input";
import { VerificationDialog } from "@/components/ui/verification-dialog";
import {
  sendForgotPasswordVerification,
  verifyForgotPasswordCode,
  type ForgotPasswordVerification,
} from "@/lib/auth/forgot-password";
import {
  validateForgotPassword,
  type ForgotPasswordFormValues,
} from "@/lib/validations/forgot-password";

const initialValues: ForgotPasswordFormValues = {
  identifier: "",
};

export function ForgotPasswordForm() {
  const router = useRouter();
  const [verificationTarget, setVerificationTarget] =
    useState<ForgotPasswordVerification | null>(null);

  const handleCloseVerificationDialog = useCallback(() => {
    setVerificationTarget(null);
  }, []);

  const handleResendVerification = useCallback(async () => {
    if (!verificationTarget) {
      return;
    }

    await sendForgotPasswordVerification(verificationTarget.destination);
  }, [verificationTarget]);

  const handleVerifyCode = useCallback(
    async (code: string) => {
      if (!verificationTarget) {
        return;
      }

      const result = await verifyForgotPasswordCode(
        verificationTarget.destination,
        code,
      );

      router.replace(`/auth/${result.resetToken}/reset`);
    },
    [router, verificationTarget],
  );

  async function handleSubmit(
    values: ForgotPasswordFormValues,
    { setFieldError }: FormikHelpers<ForgotPasswordFormValues>,
  ): Promise<void> {
    try {
      const result = await sendForgotPasswordVerification(values.identifier);

      setVerificationTarget(result);
    } catch (error) {
      setFieldError(
        "identifier",
        error instanceof Error
          ? error.message
          : "Unable to send the verification code.",
      );
    }
  }

  return (
    <>
      <Formik
        initialValues={initialValues}
        validate={validateForgotPassword}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Card className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <KeyRound className="size-7" aria-hidden="true" />
              </div>
              <h1 className="brand-gradient-text text-2xl font-extrabold tracking-tight">
                Forgot your password?
              </h1>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed font-medium text-muted-foreground">
                No worries. Enter the email address or phone number linked to
                your account and we&apos;ll send you a verification code.
              </p>
            </div>

            <Form className="space-y-5" noValidate>
              <FormikInput
                name="identifier"
                label="Email or phone number"
                type="text"
                autoComplete="username"
                placeholder="name@example.com or +639123456789"
                leadingIcon={Mail}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Checking account..."
                  : "Send Verification Code"}
              </Button>

              <p className="pt-2 text-center text-xs font-medium text-muted-foreground">
                Remembered your password?{" "}
                <Button
                  variant="text"
                  type="button"
                  onClick={() => router.push("/auth")}
                >
                  Sign in
                </Button>
              </p>
            </Form>
          </Card>
        )}
      </Formik>

      <VerificationDialog
        key={`${verificationTarget?.method ?? "none"}:${verificationTarget?.destination ?? ""}`}
        open={verificationTarget !== null}
        method={verificationTarget?.method ?? "email"}
        destination={verificationTarget?.destination ?? ""}
        onClose={handleCloseVerificationDialog}
        onVerify={handleVerifyCode}
        onResend={handleResendVerification}
      />
    </>
  );
}
