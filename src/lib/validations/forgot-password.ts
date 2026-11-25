import { z } from "zod";
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

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

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
