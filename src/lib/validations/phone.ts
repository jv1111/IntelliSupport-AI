import { z } from "zod";

export const phoneNumberSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s().-]/g, ""))
  .pipe(
    z
      .string()
      .regex(
        /^\+[1-9]\d{7,14}$/,
        "Enter a valid phone number with its country code.",
      ),
  );

export const addPhoneSchema = z.object({
  phone: phoneNumberSchema,
});

export const verifyPhoneSchema = z.object({
  phone: phoneNumberSchema,
  code: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit verification code."),
});

export type AddPhoneInput = z.infer<typeof addPhoneSchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;
