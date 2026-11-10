"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, UserRound } from "lucide-react";

interface SignUpFormProps {
  onSignIn: () => void;
}

export function SignUpForm({ onSignIn }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <div>
          <label
            htmlFor="signup-username"
            className="mb-1.5 block text-xs font-bold text-foreground"
          >
            Username
          </label>
          <div className="group relative">
            <UserRound
              aria-hidden="true"
              className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary"
            />
            <Input
              id="signup-username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Choose a username"
              className="pr-3.5 pl-10"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="mb-1.5 block text-xs font-bold text-foreground"
          >
            Password
          </label>
          <div className="group relative">
            <Lock
              aria-hidden="true"
              className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary"
            />
            <Input
              id="signup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
              className="pr-10 pl-10"
            />
            <Button
              variant="icon"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute top-1/2 right-3.5 -translate-y-1/2"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <label
            htmlFor="signup-confirm-password"
            className="mb-1.5 block text-xs font-bold text-foreground"
          >
            Confirm Password
          </label>
          <div className="group relative">
            <Lock
              aria-hidden="true"
              className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary"
            />
            <Input
              id="signup-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm your password"
              className="pr-10 pl-10"
            />
            <Button
              variant="icon"
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute top-1/2 right-3.5 -translate-y-1/2"
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
          </div>
        </div>

        <Button type="submit">Create Account</Button>

        <p className="pt-2 text-center text-xs font-medium text-muted-foreground">
          Already have an account?{" "}
          <Button variant="text" type="button" onClick={onSignIn}>
            Sign in
          </Button>
        </p>
      </form>
    </Card>
  );
}
