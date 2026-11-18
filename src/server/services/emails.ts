import "server-only";

import argon2 from "argon2";
import { randomInt } from "node:crypto";
import { addEmailSchema, verifyEmailSchema } from "@/lib/validations/email";
import { formatValidationErrors } from "@/lib/validations/format-validation-errors";
import { prisma } from "@/server/db/prisma";
import { sendVerificationEmail } from "@/server/email/brevo";

const VERIFICATION_CODE_DURATION_MS = 15 * 60 * 1000;

export class EmailError extends Error {
  constructor(
    public readonly code:
      | "INVALID_INPUT"
      | "EMAIL_ALREADY_VERIFIED"
      | "EMAIL_NOT_FOUND"
      | "INVALID_VERIFICATION_CODE"
      | "VERIFICATION_CODE_EXPIRED",
    message: string,
  ) {
    super(message);
    this.name = "EmailError";
  }
}

export interface AccountEmail {
  id: string;
  email: string;
  status: "VERIFIED" | "UNVERIFIED";
  verifiedAt: Date | null;
  expiresAt: Date | null;
}

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function generateVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function getAccountEmails(
  userId: string,
): Promise<AccountEmail[]> {
  const [verifiedEmails, pendingEmails] = await Promise.all([
    prisma.userEmail.findMany({
      where: { userId },
      orderBy: { verifiedAt: "desc" },
      select: {
        id: true,
        email: true,
        verifiedAt: true,
      },
    }),
    prisma.unverifiedEmail.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        expiresAt: true,
      },
    }),
  ]);

  return [
    ...verifiedEmails.map((email) => ({
      id: email.id,
      email: email.email,
      status: "VERIFIED" as const,
      verifiedAt: email.verifiedAt,
      expiresAt: null,
    })),
    ...pendingEmails.map((email) => ({
      id: email.id,
      email: email.email,
      status: "UNVERIFIED" as const,
      verifiedAt: null,
      expiresAt: email.expiresAt,
    })),
  ].sort((a, b) => {
    const aDate =
      a.verifiedAt?.getTime() ??
      (a.expiresAt?.getTime() ?? 0) - VERIFICATION_CODE_DURATION_MS;

    const bDate =
      b.verifiedAt?.getTime() ??
      (b.expiresAt?.getTime() ?? 0) - VERIFICATION_CODE_DURATION_MS;

    return bDate - aDate;
  });
}

export async function addEmail(userId: string, input: unknown) {
  const validationResult = addEmailSchema.safeParse(input);

  if (!validationResult.success) {
    throw new EmailError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const { email } = validationResult.data;
  const verificationCode = generateVerificationCode();

  const verificationCodeHash = await argon2.hash(verificationCode, {
    type: argon2.argon2id,
  });

  const expiresAt = new Date(Date.now() + VERIFICATION_CODE_DURATION_MS);

  const pendingEmail = await prisma.$transaction(
    async (transaction) => {
      const existingEmail = await transaction.userEmail.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingEmail) {
        throw new EmailError(
          "EMAIL_ALREADY_VERIFIED",
          "This email address has already been verified.",
        );
      }

      await transaction.unverifiedEmail.deleteMany({
        where: {
          userId,
          email,
        },
      });

      return transaction.unverifiedEmail.create({
        data: {
          email,
          verificationCodeHash,
          expiresAt,
          userId,
        },
        select: {
          id: true,
          email: true,
          expiresAt: true,
        },
      });
    },
    {
      isolationLevel: "Serializable",
    },
  );

  await sendVerificationEmail({
    recipientEmail: pendingEmail.email,
    verificationCode,
  });

  return {
    id: pendingEmail.id,
    email: pendingEmail.email,
    status: "UNVERIFIED" as const,
    verifiedAt: null,
    expiresAt: pendingEmail.expiresAt,
  };
}

export async function deleteAccountEmail(
  userId: string,
  emailId: string,
): Promise<boolean> {
  const deletedCount = await prisma.$transaction(async (transaction) => {
    const verifiedEmail = await transaction.userEmail.deleteMany({
      where: {
        id: emailId,
        userId,
      },
    });

    const pendingEmail = await transaction.unverifiedEmail.deleteMany({
      where: {
        id: emailId,
        userId,
      },
    });

    return verifiedEmail.count + pendingEmail.count;
  });

  if (deletedCount === 0) {
    throw new EmailError("EMAIL_NOT_FOUND", "Email address not found.");
  }

  return true;
}

export async function verifyEmail(userId: string, input: unknown) {
  const validationResult = verifyEmailSchema.safeParse(input);

  if (!validationResult.success) {
    throw new EmailError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const { email, code } = validationResult.data;

  const pendingEmail = await prisma.unverifiedEmail.findFirst({
    where: {
      userId,
      email,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      verificationCodeHash: true,
      expiresAt: true,
    },
  });

  if (!pendingEmail) {
    const existingEmail = await prisma.userEmail.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingEmail) {
      throw new EmailError(
        "EMAIL_ALREADY_VERIFIED",
        "This email address has already been verified.",
      );
    }

    throw new EmailError(
      "EMAIL_NOT_FOUND",
      "No pending verification was found for this email address.",
    );
  }

  if (pendingEmail.expiresAt.getTime() <= Date.now()) {
    await prisma.unverifiedEmail.deleteMany({
      where: {
        userId,
        email,
        expiresAt: { lte: new Date() },
      },
    });

    throw new EmailError(
      "VERIFICATION_CODE_EXPIRED",
      "The verification code has expired. Request a new code.",
    );
  }

  const isCodeValid = await argon2.verify(
    pendingEmail.verificationCodeHash,
    code,
  );

  if (!isCodeValid) {
    throw new EmailError(
      "INVALID_VERIFICATION_CODE",
      "The verification code is incorrect.",
    );
  }

  try {
    const verifiedEmail = await prisma.$transaction(
      async (transaction) => {
        const currentPendingEmail =
          await transaction.unverifiedEmail.findUnique({
            where: { id: pendingEmail.id },
            select: {
              userId: true,
              email: true,
              expiresAt: true,
              verificationCodeHash: true,
            },
          });

        if (!currentPendingEmail || currentPendingEmail.userId !== userId) {
          throw new EmailError(
            "EMAIL_NOT_FOUND",
            "The pending email verification no longer exists.",
          );
        }

        if (currentPendingEmail.expiresAt.getTime() <= Date.now()) {
          throw new EmailError(
            "VERIFICATION_CODE_EXPIRED",
            "The verification code has expired. Request a new code.",
          );
        }

        if (
          currentPendingEmail.verificationCodeHash !==
          pendingEmail.verificationCodeHash
        ) {
          throw new EmailError(
            "INVALID_VERIFICATION_CODE",
            "A newer verification code has been generated.",
          );
        }

        const existingEmail = await transaction.userEmail.findUnique({
          where: { email },
          select: { id: true },
        });

        if (existingEmail) {
          throw new EmailError(
            "EMAIL_ALREADY_VERIFIED",
            "This email address has already been verified.",
          );
        }

        const verified = await transaction.userEmail.create({
          data: {
            email,
            userId,
          },
          select: {
            id: true,
            email: true,
            verifiedAt: true,
          },
        });

        await transaction.unverifiedEmail.deleteMany({
          where: { email },
        });

        return verified;
      },
      {
        isolationLevel: "Serializable",
      },
    );

    return {
      id: verifiedEmail.id,
      email: verifiedEmail.email,
      status: "VERIFIED" as const,
      verifiedAt: verifiedEmail.verifiedAt,
      expiresAt: null,
    };
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new EmailError(
        "EMAIL_ALREADY_VERIFIED",
        "This email address has already been verified.",
      );
    }

    throw error;
  }
}
