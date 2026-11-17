"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { GraphQLRequestError } from "@/lib/graphql/client";
import {
  changePassword as changePasswordRequest,
  type ChangePasswordInput,
} from "@/lib/auth/change-password";

import type { StatusDialogStatus } from "@/components/ui/status-dialog";

export interface PasswordChangeDialogState {
  status: StatusDialogStatus;
  title: string;
  message: string;
  actionLabel: string;
}

type ChangePasswordResult =
  { success: true } | { success: false; code?: string };

export function useAccountSettings() {
  const router = useRouter();

  const [passwordDialog, setPasswordDialog] =
    useState<PasswordChangeDialogState | null>(null);

  const changePassword = useCallback(
    async (input: ChangePasswordInput): Promise<ChangePasswordResult> => {
      setPasswordDialog({
        status: "loading",
        title: "Changing password",
        message: "Please wait while your password is being updated.",
        actionLabel: "Close",
      });

      try {
        await changePasswordRequest(input);

        setPasswordDialog({
          status: "success",
          title: "Password changed",
          message:
            "Your password has been changed successfully. All devices have been signed out. Please sign in again.",
          actionLabel: "Sign in",
        });

        return { success: true };
      } catch (error) {
        setPasswordDialog({
          status: "error",
          title: "Password change failed",
          message:
            error instanceof Error
              ? error.message
              : "Unable to change password. Please try again.",
          actionLabel: "Close",
        });

        return {
          success: false,
          code: error instanceof GraphQLRequestError ? error.code : undefined,
        };
      }
    },
    [],
  );

  const closePasswordDialog = useCallback(() => {
    const shouldRedirectToSignIn = passwordDialog?.status === "success";

    setPasswordDialog(null);

    if (shouldRedirectToSignIn) {
      router.replace("/auth");
    }
  }, [passwordDialog?.status, router]);

  return {
    passwordDialog,
    changePassword,
    closePasswordDialog,
  };
}
