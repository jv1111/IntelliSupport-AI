"use client";

import { useState } from "react";
import { SignInForm } from "@/components/auth/signin-form";
import { SignUpForm } from "@/components/auth/signup-form";

export function AuthSwitcher() {
  const [isSignUpVisible, setIsSignUpVisible] = useState(false);

  return isSignUpVisible ? (
    <SignUpForm onSignIn={() => setIsSignUpVisible(false)} />
  ) : (
    <SignInForm onSignUp={() => setIsSignUpVisible(true)} />
  );
}
