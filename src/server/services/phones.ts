import "server-only";

import argon2 from "argon2";
import { randomInt } from "node:crypto";
import { addPhoneSchema, verifyPhoneSchema } from "@/lib/validations/phone";
import { formatValidationErrors } from "@/lib/validations/format-validation-errors";
import { prisma } from "@/server/db/prisma";
import { sendVerificationSms } from "@/server/sms/unisms";

const VERIFICATION_CODE_DURATION_MS = 15 * 60 * 1000;

export class PhoneError extends Error {
  constructor(
    public readonly code:
      | "INVALID_INPUT"
      | "PHONE_ALREADY_VERIFIED"
      | "PHONE_NOT_FOUND"
      | "INVALID_VERIFICATION_CODE"
      | "VERIFICATION_CODE_EXPIRED",
    message: string,
  ) {
    super(message);
    this.name = "PhoneError";
  }
}

export interface AccountPhone {
  id: string;
  phone: string;
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

export async function getAccountPhones(
  userId: string,
): Promise<AccountPhone[]> {
  const [verifiedPhones, pendingPhones] = await Promise.all([
    prisma.userPhone.findMany({
      where: { userId },
      orderBy: { verifiedAt: "desc" },
      select: {
        id: true,
        phone: true,
        verifiedAt: true,
      },
    }),
    prisma.unverifiedPhone.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        phone: true,
        expiresAt: true,
      },
    }),
  ]);

  return [
    ...verifiedPhones.map((phone) => ({
      id: phone.id,
      phone: phone.phone,
      status: "VERIFIED" as const,
      verifiedAt: phone.verifiedAt,
      expiresAt: null,
    })),
    ...pendingPhones.map((phone) => ({
      id: phone.id,
      phone: phone.phone,
      status: "UNVERIFIED" as const,
      verifiedAt: null,
      expiresAt: phone.expiresAt,
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

export async function addPhone(userId: string, input: unknown) {
  const validationResult = addPhoneSchema.safeParse(input);

  if (!validationResult.success) {
    throw new PhoneError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const { phone } = validationResult.data;
  const verificationCode = generateVerificationCode();

  const verificationCodeHash = await argon2.hash(verificationCode, {
    type: argon2.argon2id,
  });

  const expiresAt = new Date(Date.now() + VERIFICATION_CODE_DURATION_MS);

  const pendingPhone = await prisma.$transaction(
    async (transaction) => {
      const existingPhone = await transaction.userPhone.findUnique({
        where: { phone },
        select: { id: true },
      });

      if (existingPhone) {
        throw new PhoneError(
          "PHONE_ALREADY_VERIFIED",
          "This phone number has already been verified.",
        );
      }

      await transaction.unverifiedPhone.deleteMany({
        where: {
          userId,
          phone,
        },
      });

      return transaction.unverifiedPhone.create({
        data: {
          phone,
          verificationCodeHash,
          expiresAt,
          userId,
        },
        select: {
          id: true,
          phone: true,
          expiresAt: true,
        },
      });
    },
    {
      isolationLevel: "Serializable",
    },
  );

  await sendVerificationSms({
    recipientPhone: pendingPhone.phone,
    verificationCode,
  });

  return {
    id: pendingPhone.id,
    phone: pendingPhone.phone,
    status: "UNVERIFIED" as const,
    verifiedAt: null,
    expiresAt: pendingPhone.expiresAt,
  };
}

export async function deleteAccountPhone(
  userId: string,
  phoneId: string,
): Promise<boolean> {
  const deletedCount = await prisma.$transaction(async (transaction) => {
    const verifiedPhone = await transaction.userPhone.deleteMany({
      where: {
        id: phoneId,
        userId,
      },
    });

    const pendingPhone = await transaction.unverifiedPhone.deleteMany({
      where: {
        id: phoneId,
        userId,
      },
    });

    return verifiedPhone.count + pendingPhone.count;
  });

  if (deletedCount === 0) {
    throw new PhoneError("PHONE_NOT_FOUND", "Phone number not found.");
  }

  return true;
}

export async function verifyPhone(userId: string, input: unknown) {
  const validationResult = verifyPhoneSchema.safeParse(input);

  if (!validationResult.success) {
    throw new PhoneError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const { phone, code } = validationResult.data;

  const pendingPhone = await prisma.unverifiedPhone.findFirst({
    where: {
      userId,
      phone,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      verificationCodeHash: true,
      expiresAt: true,
    },
  });

  if (!pendingPhone) {
    const existingPhone = await prisma.userPhone.findUnique({
      where: { phone },
      select: { id: true },
    });

    if (existingPhone) {
      throw new PhoneError(
        "PHONE_ALREADY_VERIFIED",
        "This phone number has already been verified.",
      );
    }

    throw new PhoneError(
      "PHONE_NOT_FOUND",
      "No pending verification was found for this phone number.",
    );
  }

  if (pendingPhone.expiresAt.getTime() <= Date.now()) {
    await prisma.unverifiedPhone.deleteMany({
      where: {
        userId,
        phone,
        expiresAt: { lte: new Date() },
      },
    });

    throw new PhoneError(
      "VERIFICATION_CODE_EXPIRED",
      "The verification code has expired. Request a new code.",
    );
  }

  const isCodeValid = await argon2.verify(
    pendingPhone.verificationCodeHash,
    code,
  );

  if (!isCodeValid) {
    throw new PhoneError(
      "INVALID_VERIFICATION_CODE",
      "The verification code is incorrect.",
    );
  }

  try {
    const verifiedPhone = await prisma.$transaction(
      async (transaction) => {
        const currentPendingPhone =
          await transaction.unverifiedPhone.findUnique({
            where: { id: pendingPhone.id },
            select: {
              userId: true,
              phone: true,
              expiresAt: true,
              verificationCodeHash: true,
            },
          });

        if (!currentPendingPhone || currentPendingPhone.userId !== userId) {
          throw new PhoneError(
            "PHONE_NOT_FOUND",
            "The pending phone verification no longer exists.",
          );
        }

        if (currentPendingPhone.expiresAt.getTime() <= Date.now()) {
          throw new PhoneError(
            "VERIFICATION_CODE_EXPIRED",
            "The verification code has expired. Request a new code.",
          );
        }

        if (
          currentPendingPhone.verificationCodeHash !==
          pendingPhone.verificationCodeHash
        ) {
          throw new PhoneError(
            "INVALID_VERIFICATION_CODE",
            "A newer verification code has been generated.",
          );
        }

        const existingPhone = await transaction.userPhone.findUnique({
          where: { phone },
          select: { id: true },
        });

        if (existingPhone) {
          throw new PhoneError(
            "PHONE_ALREADY_VERIFIED",
            "This phone number has already been verified.",
          );
        }

        const verified = await transaction.userPhone.create({
          data: {
            phone,
            userId,
          },
          select: {
            id: true,
            phone: true,
            verifiedAt: true,
          },
        });

        await transaction.unverifiedPhone.deleteMany({
          where: { phone },
        });

        return verified;
      },
      {
        isolationLevel: "Serializable",
      },
    );

    return {
      id: verifiedPhone.id,
      phone: verifiedPhone.phone,
      status: "VERIFIED" as const,
      verifiedAt: verifiedPhone.verifiedAt,
      expiresAt: null,
    };
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new PhoneError(
        "PHONE_ALREADY_VERIFIED",
        "This phone number has already been verified.",
      );
    }

    throw error;
  }
}
