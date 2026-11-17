"use client";

import { useRouter } from "next/navigation";
import { Form, Formik, type FormikHelpers } from "formik";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormikInput } from "@/components/ui/formik-input";
import { PasswordFormikInput } from "@/components/ui/password-formik-input";
import { loginUser } from "@/lib/auth/login-user";
import { validateLogin, type LoginFormValues } from "@/lib/validations/auth";
import { Lock, UserRound } from "lucide-react";

interface SignInFormProps {
  onSignUp: () => void;
}

interface FormFeedback {
  type: "error";
  message: string;
}

const initialValues: LoginFormValues = {
  username: "",
  password: "",
};

export function SignInForm({ onSignUp }: SignInFormProps) {
  const router = useRouter();

  async function handleSubmit(
    values: LoginFormValues,
    { setStatus }: FormikHelpers<LoginFormValues>,
  ): Promise<void> {
    setStatus(undefined);

    try {
      await loginUser(values);
      router.replace("/");
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to sign in. Please try again.",
      });
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      validate={validateLogin}
      onSubmit={handleSubmit}
    >
      {({ status, isSubmitting }) => {
        const feedback = status as FormFeedback | undefined;

        return (
          <Card className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <h2 className="brand-gradient-text text-2xl font-extrabold tracking-tight">
                Welcome back
              </h2>
              <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                Sign in to access your support center.
              </p>
            </div>

            <Form className="space-y-5" noValidate>
              <FormikInput
                name="username"
                label="Username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                leadingIcon={UserRound}
              />

              <div className="relative">
                <PasswordFormikInput
                  name="password"
                  label="Password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  leadingIcon={Lock}
                />

                <Button
                  variant="text"
                  type="button"
                  className="absolute right-0 bottom-[2.2rem]"
                >
                  Forgot?
                </Button>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>

              {feedback?.message && (
                <p className="text-center text-xs text-danger" role="alert">
                  {feedback.message}
                </p>
              )}

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  or
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button variant="secondary" type="button">
                <span
                  aria-hidden="true"
                  className="mr-2 bg-linear-to-br from-blue-500 via-green-500 to-amber-500 bg-clip-text text-sm leading-none font-extrabold text-transparent"
                >
                  G
                </span>
                Sign in with Google
              </Button>

              <p className="pt-2 text-center text-xs font-medium text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Button
                  variant="text"
                  type="button"
                  onClick={onSignUp}
                  disabled={isSubmitting}
                >
                  Sign up
                </Button>
              </p>
            </Form>
          </Card>
        );
      }}
    </Formik>
  );
}
