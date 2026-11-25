import { z } from "zod";
import {
  confirmPasswordSchema,
  loginPasswordSchema,
  newPasswordSchema,
} from "@/lib/validations/password";

const usernameSchema = z
  .string()
  .trim()
  .min(1, "Username is required.")
  .max(50, "Username cannot exceed 50 characters.")
  .transform((value) => value.toLowerCase());

export const registerCredentialsSchema = z.object({
  username: usernameSchema,
  password: newPasswordSchema,
});

export const loginCredentialsSchema = z.object({
  username: usernameSchema,
  password: loginPasswordSchema,
});

export const signUpSchema = registerCredentialsSchema
  .extend({
    confirmPassword: confirmPasswordSchema,
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

export function validateSignUp(
  values: SignUpFormValues,
): Partial<Record<keyof SignUpFormValues, string>> {
  const result = signUpSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<
    Partial<Record<keyof SignUpFormValues, string>>
  >((errors, issue) => {
    const field = issue.path[0];

    if (
      (field === "username" ||
        field === "password" ||
        field === "confirmPassword") &&
      !errors[field]
    ) {
      errors[field] = issue.message;
    }

    return errors;
  }, {});
}

export const changePasswordSchema = z
  .object({
    currentPassword: loginPasswordSchema,
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "New password must be different from your current password.",
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function validateChangePassword(
  values: ChangePasswordFormValues,
): Partial<Record<keyof ChangePasswordFormValues, string>> {
  if (
    values.currentPassword === "" &&
    values.newPassword === "" &&
    values.confirmPassword === ""
  ) {
    return {};
  }

  const result = changePasswordSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<
    Partial<Record<keyof ChangePasswordFormValues, string>>
  >((errors, issue) => {
    const field = issue.path[0];

    if (
      (field === "currentPassword" ||
        field === "newPassword" ||
        field === "confirmPassword") &&
      !errors[field]
    ) {
      errors[field] = issue.message;
    }

    return errors;
  }, {});
}

export type LoginFormValues = z.infer<typeof loginCredentialsSchema>;

export function validateLogin(
  values: LoginFormValues,
): Partial<Record<keyof LoginFormValues, string>> {
  const result = loginCredentialsSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<
    Partial<Record<keyof LoginFormValues, string>>
  >((errors, issue) => {
    const field = issue.path[0];

    if ((field === "username" || field === "password") && !errors[field]) {
      errors[field] = issue.message;
    }

    return errors;
  }, {});
}
