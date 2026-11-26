import "server-only";

import argon2 from "argon2";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { formatValidationErrors } from "@/lib/validations/format-validation-errors";
import { emailAddressSchema } from "@/lib/validations/email";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyForgotPasswordCodeSchema,
} from "@/lib/validations/forgot-password";
import { phoneNumberSchema } from "@/lib/validations/phone";
import { prisma } from "@/server/db/prisma";
import { sendPasswordResetEmail } from "@/server/email/brevo";
import { sendVerificationSms } from "@/server/sms/unisms";

const VERIFICATION_CODE_DURATION_MS = 15 * 60 * 1000;
const RESET_TOKEN_DURATION_MS = 15 * 60 * 1000;

type VerificationMethod = "email" | "phone";

export class ForgotPasswordError extends Error {
  constructor(
    public readonly code:
      | "INVALID_INPUT"
      | "USER_NOT_FOUND"
      | "NOT_VERIFIED"
      | "VERIFICATION_NOT_FOUND"
      | "INVALID_VERIFICATION_CODE"
      | "VERIFICATION_CODE_EXPIRED"
      | "INVALID_RESET_TOKEN",
    message: string,
  ) {
    super(message);
    this.name = "ForgotPasswordError";
  }
}

export interface ForgotPasswordVerification {
  method: VerificationMethod;
  destination: string;
}

export interface ForgotPasswordCodeVerification {
  resetToken: string;
}

function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

async function createPasswordResetVerification(
  userId: string,
  method: VerificationMethod,
  destination: string,
): Promise<void> {
  const verificationCode = generateVerificationCode();

  const verificationCodeHash = await argon2.hash(verificationCode, {
    type: argon2.argon2id,
  });

  const expiresAt = new Date(Date.now() + VERIFICATION_CODE_DURATION_MS);

  await prisma.$transaction(async (transaction) => {
    await transaction.passwordResetVerification.deleteMany({
      where: {
        userId,
        method,
        destination,
        consumedAt: null,
      },
    });

    await transaction.passwordResetVerification.create({
      data: {
        userId,
        method,
        destination,
        verificationCodeHash,
        expiresAt,
      },
    });
  });

  if (method === "email") {
    await sendPasswordResetEmail({
      recipientEmail: destination,
      verificationCode,
    });

    return;
  }

  await sendVerificationSms({
    recipientPhone: destination,
    verificationCode,
  });
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
      select: {
        email: true,
        userId: true,
      },
    });

    if (verifiedEmail) {
      await createPasswordResetVerification(
        verifiedEmail.userId,
        "email",
        verifiedEmail.email,
      );

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
    select: {
      phone: true,
      userId: true,
    },
  });

  if (verifiedPhone) {
    await createPasswordResetVerification(
      verifiedPhone.userId,
      "phone",
      verifiedPhone.phone,
    );

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

export async function verifyForgotPasswordCode(
  destinationInput: unknown,
  codeInput: unknown,
): Promise<ForgotPasswordCodeVerification> {
  const validationResult = verifyForgotPasswordCodeSchema.safeParse({
    destination: destinationInput,
    code: codeInput,
  });

  if (!validationResult.success) {
    throw new ForgotPasswordError(
      "INVALID_INPUT",
      validationResult.error.issues[0]?.message ??
        "Enter a valid verification code.",
    );
  }

  const { destination, code } = validationResult.data;
  const emailResult = emailAddressSchema.safeParse(destination);

  const method: VerificationMethod = emailResult.success ? "email" : "phone";

  const normalizedDestination = emailResult.success
    ? emailResult.data
    : phoneNumberSchema.parse(destination);

  const pendingVerification = await prisma.passwordResetVerification.findFirst({
    where: {
      method,
      destination: normalizedDestination,
      verifiedAt: null,
      consumedAt: null,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      verificationCodeHash: true,
      expiresAt: true,
    },
  });

  if (!pendingVerification) {
    throw new ForgotPasswordError(
      "VERIFICATION_NOT_FOUND",
      "No pending password reset verification was found. Request a new code.",
    );
  }

  if (pendingVerification.expiresAt.getTime() <= Date.now()) {
    throw new ForgotPasswordError(
      "VERIFICATION_CODE_EXPIRED",
      "The verification code has expired. Request a new code.",
    );
  }

  const isCodeValid = await argon2.verify(
    pendingVerification.verificationCodeHash,
    code,
  );

  if (!isCodeValid) {
    throw new ForgotPasswordError(
      "INVALID_VERIFICATION_CODE",
      "The verification code is incorrect.",
    );
  }

  const resetToken = randomBytes(32).toString("base64url");

  const resetTokenHash = createHash("sha256").update(resetToken).digest("hex");

  const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_DURATION_MS);

  const updateResult = await prisma.passwordResetVerification.updateMany({
    where: {
      id: pendingVerification.id,
      verificationCodeHash: pendingVerification.verificationCodeHash,
      verifiedAt: null,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      verifiedAt: new Date(),
      resetTokenHash,
      resetTokenExpiresAt,
    },
  });

  if (updateResult.count !== 1) {
    throw new ForgotPasswordError(
      "INVALID_VERIFICATION_CODE",
      "The verification code is no longer valid. Request a new code.",
    );
  }

  return { resetToken };
}

export async function hasValidPasswordResetToken(
  resetToken: unknown,
): Promise<boolean> {
  if (
    typeof resetToken !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(resetToken)
  ) {
    return false;
  }

  const resetTokenHash = createHash("sha256").update(resetToken).digest("hex");

  const verification = await prisma.passwordResetVerification.findUnique({
    where: { resetTokenHash },
    select: {
      verifiedAt: true,
      resetTokenExpiresAt: true,
      consumedAt: true,
    },
  });

  return (
    verification !== null &&
    verification.verifiedAt !== null &&
    verification.resetTokenExpiresAt !== null &&
    verification.resetTokenExpiresAt.getTime() > Date.now() &&
    verification.consumedAt === null
  );
}

export async function resetPassword(
  resetTokenInput: unknown,
  input: unknown,
): Promise<void> {
  const validationResult = resetPasswordSchema.safeParse(input);

  if (!validationResult.success) {
    throw new ForgotPasswordError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  if (
    typeof resetTokenInput !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(resetTokenInput)
  ) {
    throw new ForgotPasswordError(
      "INVALID_RESET_TOKEN",
      "This password reset link is invalid or has expired. Request a new code.",
    );
  }

  const resetTokenHash = createHash("sha256")
    .update(resetTokenInput)
    .digest("hex");

  const { newPassword } = validationResult.data;

  const passwordHash = await argon2.hash(newPassword, {
    type: argon2.argon2id,
  });

  const now = new Date();

  await prisma.$transaction(async (transaction) => {
    const verification = await transaction.passwordResetVerification.findUnique(
      {
        where: { resetTokenHash },
        select: {
          id: true,
          userId: true,
          verifiedAt: true,
          resetTokenExpiresAt: true,
          consumedAt: true,
        },
      },
    );

    if (
      !verification ||
      verification.verifiedAt === null ||
      !verification.resetTokenExpiresAt ||
      verification.resetTokenExpiresAt.getTime() <= now.getTime() ||
      verification.consumedAt !== null
    ) {
      throw new ForgotPasswordError(
        "INVALID_RESET_TOKEN",
        "This password reset link is invalid or has expired. Request a new code.",
      );
    }

    const consumeResult =
      await transaction.passwordResetVerification.updateMany({
        where: {
          id: verification.id,
          resetTokenHash,
          verifiedAt: { not: null },
          resetTokenExpiresAt: { gt: now },
          consumedAt: null,
        },
        data: {
          consumedAt: now,
        },
      });

    if (consumeResult.count !== 1) {
      throw new ForgotPasswordError(
        "INVALID_RESET_TOKEN",
        "This password reset link is invalid or has expired. Request a new code.",
      );
    }

    await transaction.user.update({
      where: { id: verification.userId },
      data: { passwordHash },
      select: { id: true },
    });

    await transaction.session.deleteMany({
      where: { userId: verification.userId },
    });
  });
}
