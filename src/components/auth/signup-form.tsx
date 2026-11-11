"use client";

import { Form, Formik } from "formik";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormikInput } from "@/components/auth/formik-input";
import { validateSignUp, type SignUpFormValues } from "@/lib/validations/auth";
import { Eye, EyeOff, Lock, UserRound } from "lucide-react";

interface SignUpFormProps {
  onSignIn: () => void;
}

const initialValues: SignUpFormValues = {
  username: "",
  password: "",
  confirmPassword: "",
};

export function SignUpForm({ onSignIn }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Formik
      initialValues={initialValues}
      validate={validateSignUp}
      onSubmit={(_, { setStatus }) => {
        setStatus("Account registration is not connected yet.");
      }}
    >
      {({ status }) => (
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

            <FormikInput
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
              leadingIcon={Lock}
              trailingAction={
                <Button
                  variant="icon"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </Button>
              }
            />

            <FormikInput
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm your password"
              leadingIcon={Lock}
              trailingAction={
                <Button
                  variant="icon"
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </Button>
              }
            />

            <Button type="submit">Create Account</Button>

            {status && (
              <p
                className="text-center text-xs text-muted-foreground"
                role="status"
              >
                {status}
              </p>
            )}

            <p className="pt-2 text-center text-xs font-medium text-muted-foreground">
              Already have an account?{" "}
              <Button variant="text" type="button" onClick={onSignIn}>
                Sign in
              </Button>
            </p>
          </Form>
        </Card>
      )}
    </Formik>
  );
}
