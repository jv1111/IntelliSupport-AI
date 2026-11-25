import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  userEmailFindUniqueMock,
  unverifiedEmailFindFirstMock,
  userPhoneFindUniqueMock,
  unverifiedPhoneFindFirstMock,
  transactionDeleteManyMock,
  transactionCreateMock,
  transactionMock,
  verificationFindFirstMock,
  verificationUpdateManyMock,
  verificationFindUniqueMock,
  hashMock,
  verifyMock,
  sendPasswordResetEmailMock,
  sendVerificationSmsMock,
} = vi.hoisted(() => ({
  userEmailFindUniqueMock: vi.fn(),
  unverifiedEmailFindFirstMock: vi.fn(),
  userPhoneFindUniqueMock: vi.fn(),
  unverifiedPhoneFindFirstMock: vi.fn(),
  transactionDeleteManyMock: vi.fn(),
  transactionCreateMock: vi.fn(),
  transactionMock: vi.fn(),
  verificationFindFirstMock: vi.fn(),
  verificationUpdateManyMock: vi.fn(),
  verificationFindUniqueMock: vi.fn(),
  hashMock: vi.fn(),
  verifyMock: vi.fn(),
  sendPasswordResetEmailMock: vi.fn(),
  sendVerificationSmsMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("argon2", () => ({
  default: {
    hash: hashMock,
    verify: verifyMock,
    argon2id: 2,
  },
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    userEmail: {
      findUnique: userEmailFindUniqueMock,
    },
    unverifiedEmail: {
      findFirst: unverifiedEmailFindFirstMock,
    },
    userPhone: {
      findUnique: userPhoneFindUniqueMock,
    },
    unverifiedPhone: {
      findFirst: unverifiedPhoneFindFirstMock,
    },
    passwordResetVerification: {
      findFirst: verificationFindFirstMock,
      updateMany: verificationUpdateManyMock,
      findUnique: verificationFindUniqueMock,
    },
    $transaction: transactionMock,
  },
}));

vi.mock("@/server/email/brevo", () => ({
  sendPasswordResetEmail: sendPasswordResetEmailMock,
}));

vi.mock("@/server/sms/unisms", () => ({
  sendVerificationSms: sendVerificationSmsMock,
}));

import {
  hasValidPasswordResetToken,
  sendForgotPasswordVerification,
  verifyForgotPasswordCode,
} from "@/server/services/forgot-password";

const transactionContext = {
  passwordResetVerification: {
    deleteMany: transactionDeleteManyMock,
    create: transactionCreateMock,
  },
};

const validEmail = "reset@example.com";
const validPhone = "+639123456789";
const futureDate = () => new Date(Date.now() + 5 * 60 * 1000);

function createPendingVerification(overrides: Record<string, unknown> = {}) {
  return {
    id: "verification-id",
    verificationCodeHash: "hashed:123456",
    expiresAt: futureDate(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();

  userEmailFindUniqueMock.mockResolvedValue(null);
  unverifiedEmailFindFirstMock.mockResolvedValue(null);

  userPhoneFindUniqueMock.mockResolvedValue(null);
  unverifiedPhoneFindFirstMock.mockResolvedValue(null);

  transactionDeleteManyMock.mockResolvedValue({ count: 0 });
  transactionCreateMock.mockResolvedValue({
    id: "verification-id",
  });

  transactionMock.mockImplementation(
    async (
      callback: (transaction: typeof transactionContext) => Promise<unknown>,
    ) => callback(transactionContext),
  );

  verificationFindFirstMock.mockResolvedValue(null);
  verificationUpdateManyMock.mockResolvedValue({ count: 1 });
  verificationFindUniqueMock.mockResolvedValue(null);

  hashMock.mockImplementation(async (value: string) => `hashed:${value}`);

  verifyMock.mockResolvedValue(true);

  sendPasswordResetEmailMock.mockResolvedValue(undefined);
  sendVerificationSmsMock.mockResolvedValue(undefined);
});

describe("Forgot Password - Invalid Input", () => {
  it("rejects an invalid email address", async () => {
    await expect(
      sendForgotPasswordVerification("invalid-email"),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(userEmailFindUniqueMock).not.toHaveBeenCalled();
    expect(userPhoneFindUniqueMock).not.toHaveBeenCalled();
    expect(hashMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
    expect(sendVerificationSmsMock).not.toHaveBeenCalled();
  });

  it("rejects an empty identifier", async () => {
    await expect(sendForgotPasswordVerification("")).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(userEmailFindUniqueMock).not.toHaveBeenCalled();
    expect(userPhoneFindUniqueMock).not.toHaveBeenCalled();
  });
});

describe("Forgot Password - Email", () => {
  it("creates a hashed verification and sends an email", async () => {
    userEmailFindUniqueMock.mockResolvedValue({
      email: validEmail,
      userId: "test-user-id",
    });

    const result = await sendForgotPasswordVerification(validEmail);

    const verificationCode = hashMock.mock.calls[0]?.[0] as string;

    expect(result).toEqual({
      method: "email",
      destination: validEmail,
    });

    expect(userEmailFindUniqueMock).toHaveBeenCalledWith({
      where: { email: validEmail },
      select: {
        email: true,
        userId: true,
      },
    });

    expect(verificationCode).toMatch(/^\d{6}$/);

    expect(hashMock).toHaveBeenCalledWith(verificationCode, {
      type: 2,
    });

    expect(transactionDeleteManyMock).toHaveBeenCalledWith({
      where: {
        userId: "test-user-id",
        method: "email",
        destination: validEmail,
        consumedAt: null,
      },
    });

    expect(transactionCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "test-user-id",
        method: "email",
        destination: validEmail,
        verificationCodeHash: `hashed:${verificationCode}`,
        expiresAt: expect.any(Date),
      }),
    });

    const createdData = transactionCreateMock.mock.calls[0]?.[0].data;

    expect(createdData.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(createdData.expiresAt.getTime()).toBeLessThan(
      Date.now() + 16 * 60 * 1000,
    );

    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith({
      recipientEmail: validEmail,
      verificationCode,
    });

    expect(sendVerificationSmsMock).not.toHaveBeenCalled();
  });

  it("rejects an unverified email address", async () => {
    unverifiedEmailFindFirstMock.mockResolvedValue({
      id: "unverified-email-id",
    });

    await expect(
      sendForgotPasswordVerification(validEmail),
    ).rejects.toMatchObject({
      code: "NOT_VERIFIED",
    });

    expect(unverifiedEmailFindFirstMock).toHaveBeenCalledWith({
      where: { email: validEmail },
      select: { id: true },
    });

    expect(hashMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });

  it("rejects an email that does not belong to an account", async () => {
    await expect(
      sendForgotPasswordVerification(validEmail),
    ).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
    });

    expect(userEmailFindUniqueMock).toHaveBeenCalledOnce();
    expect(unverifiedEmailFindFirstMock).toHaveBeenCalledOnce();
    expect(hashMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });
});

describe("Forgot Password - Phone", () => {
  it("creates a hashed verification and sends an SMS", async () => {
    userPhoneFindUniqueMock.mockResolvedValue({
      phone: validPhone,
      userId: "test-user-id",
    });

    const result = await sendForgotPasswordVerification(validPhone);

    const verificationCode = hashMock.mock.calls[0]?.[0] as string;

    expect(result).toEqual({
      method: "phone",
      destination: validPhone,
    });

    expect(userPhoneFindUniqueMock).toHaveBeenCalledWith({
      where: { phone: validPhone },
      select: {
        phone: true,
        userId: true,
      },
    });

    expect(verificationCode).toMatch(/^\d{6}$/);

    expect(transactionDeleteManyMock).toHaveBeenCalledWith({
      where: {
        userId: "test-user-id",
        method: "phone",
        destination: validPhone,
        consumedAt: null,
      },
    });

    expect(transactionCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "test-user-id",
        method: "phone",
        destination: validPhone,
        verificationCodeHash: `hashed:${verificationCode}`,
        expiresAt: expect.any(Date),
      }),
    });

    expect(sendVerificationSmsMock).toHaveBeenCalledWith({
      recipientPhone: validPhone,
      verificationCode,
    });

    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });

  it("rejects an unverified phone number", async () => {
    unverifiedPhoneFindFirstMock.mockResolvedValue({
      id: "unverified-phone-id",
    });

    await expect(
      sendForgotPasswordVerification(validPhone),
    ).rejects.toMatchObject({
      code: "NOT_VERIFIED",
    });

    expect(unverifiedPhoneFindFirstMock).toHaveBeenCalledWith({
      where: { phone: validPhone },
      select: { id: true },
    });

    expect(hashMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(sendVerificationSmsMock).not.toHaveBeenCalled();
  });

  it("rejects a phone number that does not belong to an account", async () => {
    await expect(
      sendForgotPasswordVerification(validPhone),
    ).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
    });

    expect(userPhoneFindUniqueMock).toHaveBeenCalledOnce();
    expect(unverifiedPhoneFindFirstMock).toHaveBeenCalledOnce();
    expect(hashMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });
});

describe("Forgot Password - Code Verification", () => {
  it("rejects an invalid verification code format", async () => {
    await expect(
      verifyForgotPasswordCode(validEmail, "123"),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });

    expect(verificationFindFirstMock).not.toHaveBeenCalled();
    expect(verifyMock).not.toHaveBeenCalled();
    expect(verificationUpdateManyMock).not.toHaveBeenCalled();
  });

  it("rejects verification when no pending record exists", async () => {
    await expect(
      verifyForgotPasswordCode(validEmail, "123456"),
    ).rejects.toMatchObject({
      code: "VERIFICATION_NOT_FOUND",
    });

    expect(verificationFindFirstMock).toHaveBeenCalledOnce();
    expect(verifyMock).not.toHaveBeenCalled();
    expect(verificationUpdateManyMock).not.toHaveBeenCalled();
  });

  it("rejects an expired verification code", async () => {
    verificationFindFirstMock.mockResolvedValue(
      createPendingVerification({
        expiresAt: new Date(Date.now() - 1000),
      }),
    );

    await expect(
      verifyForgotPasswordCode(validEmail, "123456"),
    ).rejects.toMatchObject({
      code: "VERIFICATION_CODE_EXPIRED",
    });

    expect(verifyMock).not.toHaveBeenCalled();
    expect(verificationUpdateManyMock).not.toHaveBeenCalled();
  });

  it("rejects an incorrect verification code", async () => {
    verificationFindFirstMock.mockResolvedValue(createPendingVerification());

    verifyMock.mockResolvedValue(false);

    await expect(
      verifyForgotPasswordCode(validEmail, "654321"),
    ).rejects.toMatchObject({
      code: "INVALID_VERIFICATION_CODE",
    });

    expect(verifyMock).toHaveBeenCalledWith("hashed:123456", "654321");

    expect(verificationUpdateManyMock).not.toHaveBeenCalled();
  });

  it("verifies a correct code and generates a reset token", async () => {
    verificationFindFirstMock.mockResolvedValue(createPendingVerification());

    const result = await verifyForgotPasswordCode(validEmail, "123456");

    const expectedTokenHash = createHash("sha256")
      .update(result.resetToken)
      .digest("hex");

    expect(result.resetToken).toMatch(/^[A-Za-z0-9_-]{43}$/);

    expect(verificationFindFirstMock).toHaveBeenCalledWith({
      where: {
        method: "email",
        destination: validEmail,
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

    expect(verificationUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: "verification-id",
        verificationCodeHash: "hashed:123456",
        verifiedAt: null,
        consumedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: {
        verifiedAt: expect.any(Date),
        resetTokenHash: expectedTokenHash,
        resetTokenExpiresAt: expect.any(Date),
      },
    });
  });

  it("rejects verification when the database record changes before update", async () => {
    verificationFindFirstMock.mockResolvedValue(createPendingVerification());

    verificationUpdateManyMock.mockResolvedValue({ count: 0 });

    await expect(
      verifyForgotPasswordCode(validEmail, "123456"),
    ).rejects.toMatchObject({
      code: "INVALID_VERIFICATION_CODE",
    });
  });
});

describe("Forgot Password - Reset Token Validation", () => {
  it("rejects a malformed reset token without querying the database", async () => {
    const result = await hasValidPasswordResetToken("invalid-token");

    expect(result).toBe(false);
    expect(verificationFindUniqueMock).not.toHaveBeenCalled();
  });

  it("rejects a missing reset token", async () => {
    const result = await hasValidPasswordResetToken(null);

    expect(result).toBe(false);
    expect(verificationFindUniqueMock).not.toHaveBeenCalled();
  });

  it("accepts a valid verified and unconsumed reset token", async () => {
    const resetToken = "a".repeat(43);

    verificationFindUniqueMock.mockResolvedValue({
      verifiedAt: new Date(),
      resetTokenExpiresAt: futureDate(),
      consumedAt: null,
    });

    const result = await hasValidPasswordResetToken(resetToken);

    const expectedTokenHash = createHash("sha256")
      .update(resetToken)
      .digest("hex");

    expect(result).toBe(true);

    expect(verificationFindUniqueMock).toHaveBeenCalledWith({
      where: {
        resetTokenHash: expectedTokenHash,
      },
      select: {
        verifiedAt: true,
        resetTokenExpiresAt: true,
        consumedAt: true,
      },
    });
  });

  it("rejects a reset token that does not exist", async () => {
    verificationFindUniqueMock.mockResolvedValue(null);

    const result = await hasValidPasswordResetToken("a".repeat(43));

    expect(result).toBe(false);
  });

  it("rejects an unverified reset token", async () => {
    verificationFindUniqueMock.mockResolvedValue({
      verifiedAt: null,
      resetTokenExpiresAt: futureDate(),
      consumedAt: null,
    });

    const result = await hasValidPasswordResetToken("a".repeat(43));

    expect(result).toBe(false);
  });

  it("rejects an expired reset token", async () => {
    verificationFindUniqueMock.mockResolvedValue({
      verifiedAt: new Date(),
      resetTokenExpiresAt: new Date(Date.now() - 1000),
      consumedAt: null,
    });

    const result = await hasValidPasswordResetToken("a".repeat(43));

    expect(result).toBe(false);
  });

  it("rejects a consumed reset token", async () => {
    verificationFindUniqueMock.mockResolvedValue({
      verifiedAt: new Date(),
      resetTokenExpiresAt: futureDate(),
      consumedAt: new Date(),
    });

    const result = await hasValidPasswordResetToken("a".repeat(43));

    expect(result).toBe(false);
  });
});
