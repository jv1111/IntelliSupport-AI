import "server-only";

import { randomInt } from "node:crypto";
import { emailAddressSchema } from "@/lib/validations/email";
import { forgotPasswordSchema } from "@/lib/validations/forgot-password";
import { phoneNumberSchema } from "@/lib/validations/phone";
import { prisma } from "@/server/db/prisma";
import { sendPasswordResetEmail } from "@/server/email/brevo";
import { sendVerificationSms } from "@/server/sms/unisms";

export class ForgotPasswordError extends Error {
  constructor(
    public readonly code: "INVALID_INPUT" | "USER_NOT_FOUND" | "NOT_VERIFIED",
    message: string,
  ) {
    super(message);
    this.name = "ForgotPasswordError";
  }
}

export interface ForgotPasswordVerification {
  method: "email" | "phone";
  destination: string;
}

function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function sendForgotPasswordVerification(
  input: unknown,
): Promise<ForgotPasswordVerification> {
  const validationResult = forgotPasswordSchema.safeParse({
    identifier: input,
  });

  if (!validationResult.success) {
    throw new ForgotPasswordError(
      "INVALID_INPUT",
      validationResult.error.issues[0]?.message ??
        "Enter a valid email address or phone number.",
    );
  }

  const { identifier } = validationResult.data;
  const emailResult = emailAddressSchema.safeParse(identifier);

  if (emailResult.success) {
    const email = emailResult.data;

    const verifiedEmail = await prisma.userEmail.findUnique({
      where: { email },
      select: { email: true },
    });

    if (verifiedEmail) {
      await sendPasswordResetEmail({
        recipientEmail: verifiedEmail.email,
        verificationCode: generateVerificationCode(),
      });

      return {
        method: "email",
        destination: verifiedEmail.email,
      };
    }

    const unverifiedEmail = await prisma.unverifiedEmail.findFirst({
      where: { email },
      select: { id: true },
    });

    if (unverifiedEmail) {
      throw new ForgotPasswordError("NOT_VERIFIED", "Not verified");
    }

    throw new ForgotPasswordError("USER_NOT_FOUND", "User not found");
  }

  const phoneResult = phoneNumberSchema.safeParse(identifier);

  if (!phoneResult.success) {
    throw new ForgotPasswordError(
      "INVALID_INPUT",
      "Enter a valid email address or phone number.",
    );
  }

  const phone = phoneResult.data;

  const verifiedPhone = await prisma.userPhone.findUnique({
    where: { phone },
    select: { phone: true },
  });

  if (verifiedPhone) {
    await sendVerificationSms({
      recipientPhone: verifiedPhone.phone,
      verificationCode: generateVerificationCode(),
    });

    return {
      method: "phone",
      destination: verifiedPhone.phone,
    };
  }

  const unverifiedPhone = await prisma.unverifiedPhone.findFirst({
    where: { phone },
    select: { id: true },
  });

  if (unverifiedPhone) {
    throw new ForgotPasswordError("NOT_VERIFIED", "Not verified");
  }

  throw new ForgotPasswordError("USER_NOT_FOUND", "User not found");
}
