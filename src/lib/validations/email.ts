import { z } from "zod";

export const emailAddressSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .email({ error: "Enter a valid email address." })
      .max(254, "Email address cannot exceed 254 characters."),
  );

export const addEmailSchema = z.object({
  email: emailAddressSchema,
});

export const verifyEmailSchema = z.object({
  email: emailAddressSchema,
  code: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit verification code."),
});

export type AddEmailInput = z.infer<typeof addEmailSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
