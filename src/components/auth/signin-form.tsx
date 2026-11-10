"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, UserRound } from "lucide-react";

interface SignInFormProps {
  onSignUp: () => void;
}

export function SignInForm({ onSignUp }: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false);

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

      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <div>
          <label
            htmlFor="signin-username"
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
              id="signin-username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              className="pr-3.5 pl-10"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="signin-password"
              className="block text-xs font-bold text-foreground"
            >
              Password
            </label>
            <Button variant="text" type="button">
              Forgot?
            </Button>
          </div>

          <div className="group relative">
            <Lock
              aria-hidden="true"
              className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300 group-focus-within:text-primary"
            />
            <Input
              id="signin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
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

        <Button type="submit">Sign In</Button>

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
            className="mr-2 bg-linear-to-br from-blue-500 via-green-500 to-amber-500 bg-clip-text text-sm font-extrabold text-transparent"
          >
            G
          </span>
          Sign in with Google
        </Button>

        <p className="pt-2 text-center text-xs font-medium text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Button variant="text" type="button" onClick={onSignUp}>
            Sign up
          </Button>
        </p>
      </form>
    </Card>
  );
}
