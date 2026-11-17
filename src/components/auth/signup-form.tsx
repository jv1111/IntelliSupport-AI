"use client";

import { Form, Formik, type FormikHelpers } from "formik";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormikInput } from "@/components/ui/formik-input";
import { PasswordFormikInput } from "@/components/ui/password-formik-input";
import { registerUser } from "@/lib/auth/register-user";
import { validateSignUp, type SignUpFormValues } from "@/lib/validations/auth";
import { Lock, UserRound } from "lucide-react";

interface SignUpFormProps {
  onSignIn: () => void;
}

interface FormFeedback {
  type: "error";
  message: string;
}

const initialValues: SignUpFormValues = {
  username: "",
  password: "",
  confirmPassword: "",
};

export function SignUpForm({ onSignIn }: SignUpFormProps) {
  async function handleSubmit(
    { username, password }: SignUpFormValues,
    { setStatus }: FormikHelpers<SignUpFormValues>,
  ): Promise<void> {
    setStatus(undefined);

    try {
      await registerUser({ username, password });
      onSignIn();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to create your account. Please try again.",
      });
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      validate={validateSignUp}
      onSubmit={handleSubmit}
    >
      {({ status, isSubmitting }) => {
        const feedback = status as FormFeedback | undefined;

        return (
          <Card className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <h2 className="brand-gradient-text text-2xl font-extrabold tracking-tight">
                Create Account
              </h2>
              <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                Create an account to access your support center.
              </p>
            </div>

            <Form className="space-y-5" noValidate>
              <FormikInput
                name="username"
                label="Username"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                leadingIcon={UserRound}
              />

              <PasswordFormikInput
                name="password"
                label="Password"
                autoComplete="new-password"
                placeholder="Create a password"
                leadingIcon={Lock}
              />

              <PasswordFormikInput
                name="confirmPassword"
                label="Confirm Password"
                autoComplete="new-password"
                placeholder="Confirm your password"
                leadingIcon={Lock}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Button>

              {feedback?.message && (
                <p className="text-center text-xs text-danger" role="alert">
                  {feedback.message}
                </p>
              )}

              <p className="pt-2 text-center text-xs font-medium text-muted-foreground">
                Already have an account?{" "}
                <Button
                  variant="text"
                  type="button"
                  onClick={onSignIn}
                  disabled={isSubmitting}
                >
                  Sign in
                </Button>
              </p>
            </Form>
          </Card>
        );
      }}
    </Formik>
  );
}
