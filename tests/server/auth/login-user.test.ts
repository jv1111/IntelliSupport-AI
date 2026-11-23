import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInvalidInputExpectation } from "./test-utils";
import { loginUser } from "@/server/services/login-user";

const { findUniqueMock, verifyMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  verifyMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("argon2", () => ({
  default: {
    verify: verifyMock,
  },
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

const expectInvalidInput = createInvalidInputExpectation(loginUser, [
  findUniqueMock,
  verifyMock,
]);

describe("Login - Valid", () => {
  it("logs in a user with valid credentials", async () => {
    const expectedUser = {
      id: "test-user-id",
      username: "testloginvalid",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    findUniqueMock.mockResolvedValue({
      ...expectedUser,
      passwordHash: "$argon2id$test-hash",
    });

    verifyMock.mockResolvedValue(true);

    const result = await loginUser({
      username: "  TestLoginValid  ",
      password: "ValidPassword2026!",
    });

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: {
        username: "testloginvalid",
      },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    expect(verifyMock).toHaveBeenCalledWith(
      "$argon2id$test-hash",
      "ValidPassword2026!",
    );

    expect(result).toEqual(expectedUser);
  });
});

describe("Login - Invalid Username Input", () => {
  it("rejects an empty username", async () => {
    await expectInvalidInput({
      username: "",
      password: "ValidPassword2026!",
    });
  });

  it("rejects a whitespace-only username", async () => {
    await expectInvalidInput({
      username: "     ",
      password: "ValidPassword2026!",
    });
  });

  it("rejects a username exceeding 50 characters", async () => {
    await expectInvalidInput({
      username: "a".repeat(51),
      password: "ValidPassword2026!",
    });
  });

  it("rejects a non-string username", async () => {
    await expectInvalidInput({
      username: 12345,
      password: "ValidPassword2026!",
    });
  });
});

describe("Login - Invalid Password Input", () => {
  it("rejects an empty password", async () => {
    await expectInvalidInput({
      username: "validusername",
      password: "",
    });
  });

  it("rejects a password exceeding 128 characters", async () => {
    await expectInvalidInput({
      username: "validusername",
      password: "a".repeat(129),
    });
  });

  it("rejects a non-string password", async () => {
    await expectInvalidInput({
      username: "validusername",
      password: 12345678,
    });
  });
});

describe("Login - Invalid Credentials", () => {
  it("rejects login when the username does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(
      loginUser({
        username: "nonexistentuser",
        password: "ValidPassword2026!",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid username or password.",
    });

    expect(findUniqueMock).toHaveBeenCalledOnce();
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("rejects login when the password is incorrect", async () => {
    findUniqueMock.mockResolvedValue({
      id: "test-user-id",
      username: "validusername",
      passwordHash: "$argon2id$test-hash",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    verifyMock.mockResolvedValue(false);

    await expect(
      loginUser({
        username: "validusername",
        password: "WrongPassword2026!",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid username or password.",
    });

    expect(findUniqueMock).toHaveBeenCalledOnce();
    expect(verifyMock).toHaveBeenCalledOnce();
  });
});

describe("Login - Unexpected Database Error", () => {
  it("propagates unexpected database errors", async () => {
    const databaseError = new Error("Database connection failed");

    findUniqueMock.mockRejectedValue(databaseError);

    await expect(
      loginUser({
        username: "validusername",
        password: "ValidPassword2026!",
      }),
    ).rejects.toBe(databaseError);

    expect(findUniqueMock).toHaveBeenCalledOnce();
    expect(verifyMock).not.toHaveBeenCalled();
  });
});

describe("Login - Password Verification Error", () => {
  it("propagates password verification errors", async () => {
    const verificationError = new Error("Password verification failed");

    findUniqueMock.mockResolvedValue({
      id: "test-user-id",
      username: "validusername",
      passwordHash: "$argon2id$test-hash",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    verifyMock.mockRejectedValue(verificationError);

    await expect(
      loginUser({
        username: "validusername",
        password: "ValidPassword2026!",
      }),
    ).rejects.toBe(verificationError);

    expect(findUniqueMock).toHaveBeenCalledOnce();
    expect(verifyMock).toHaveBeenCalledOnce();
  });
});
