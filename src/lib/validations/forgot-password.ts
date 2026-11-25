import { z } from "zod";
import {
  confirmPasswordSchema,
  newPasswordSchema,
} from "@/lib/validations/password";
import { emailAddressSchema } from "@/lib/validations/email";
import { phoneNumberSchema } from "@/lib/validations/phone";

const identifierSchema = z
  .string()
  .trim()
  .min(1, "Enter your email or phone number.")
  .transform((value) => {
    const email = emailAddressSchema.safeParse(value);

    if (email.success) {
      return email.data;
    }

    const phone = phoneNumberSchema.safeParse(value);

    return phone.success ? phone.data : value;
  })
  .refine(
    (value) =>
      emailAddressSchema.safeParse(value).success ||
      phoneNumberSchema.safeParse(value).success,
    "Enter a valid email address or phone number.",
  );

export const forgotPasswordSchema = z.object({
  identifier: identifierSchema,
});

export const verifyForgotPasswordCodeSchema = z.object({
  destination: z
    .string()
    .trim()
    .min(1, "Enter a valid email address or phone number.")
    .refine(
      (value) =>
        emailAddressSchema.safeParse(value).success ||
        phoneNumberSchema.safeParse(value).success,
      "Enter a valid email address or phone number.",
    ),
  code: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit verification code."),
});

export const resetPasswordSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function validateForgotPassword(
  values: ForgotPasswordFormValues,
): Partial<Record<keyof ForgotPasswordFormValues, string>> {
  const result = forgotPasswordSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  return {
    identifier: result.error.issues[0]?.message,
  };
}

export function validateResetPassword(
  values: ResetPasswordFormValues,
): Partial<Record<keyof ResetPasswordFormValues, string>> {
  const result = resetPasswordSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  return result.error.issues.reduce<
    Partial<Record<keyof ResetPasswordFormValues, string>>
  >((errors, issue) => {
    const field = issue.path[0];

    if (
      (field === "newPassword" || field === "confirmPassword") &&
      !errors[field]
    ) {
      errors[field] = issue.message;
    }

    return errors;
  }, {});
}
