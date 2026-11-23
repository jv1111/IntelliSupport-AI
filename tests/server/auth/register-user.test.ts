import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInvalidInputExpectation } from "./test-utils";
import { registerUser } from "@/server/services/register-user";

const { findUniqueMock, createMock, hashMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
  hashMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("argon2", () => ({
  default: {
    hash: hashMock,
    argon2id: 2,
  },
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
      create: createMock,
    },
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

const expectInvalidInput = createInvalidInputExpectation(registerUser, [
  findUniqueMock,
  hashMock,
  createMock,
]);

describe("Register - Valid", () => {
  it("registers a user with valid credentials", async () => {
    const expectedUser = {
      id: "test-user-id",
      username: "testregistervalid",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    findUniqueMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("$argon2id$test-hash");
    createMock.mockResolvedValue(expectedUser);

    const result = await registerUser({
      username: "  TestRegisterValid  ",
      password: "ValidPassword2026!",
    });

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: {
        username: "testregistervalid",
      },
      select: {
        id: true,
      },
    });

    expect(hashMock).toHaveBeenCalledWith("ValidPassword2026!", {
      type: 2,
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        username: "testregistervalid",
        passwordHash: "$argon2id$test-hash",
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    expect(result).toEqual(expectedUser);
  });
});

describe("Register - Invalid Username Input", () => {
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

describe("Register - Invalid Password Input", () => {
  it("rejects an empty password", async () => {
    await expectInvalidInput({
      username: "validusername",
      password: "",
    });
  });

  it("rejects a password shorter than 8 characters", async () => {
    await expectInvalidInput({
      username: "validusername",
      password: "short1",
    });
  });

  it("rejects a password exceeding 128 characters", async () => {
    await expectInvalidInput({
      username: "validusername",
      password: "a1".repeat(64) + "a",
    });
  });

  it("rejects a password without a number", async () => {
    await expectInvalidInput({
      username: "validusername",
      password: "PasswordWithoutNumber",
    });
  });

  it("rejects a password without a letter", async () => {
    await expectInvalidInput({
      username: "validusername",
      password: "1234567890",
    });
  });

  it("rejects a non-string password", async () => {
    await expectInvalidInput({
      username: "validusername",
      password: 12345678,
    });
  });
});

describe("Register - Invalid Registration Input", () => {
  it("rejects a null registration input", async () => {
    await expectInvalidInput(null);
  });
});

describe("Register - Username Already Taken", () => {
  it("rejects registration when the username already exists", async () => {
    findUniqueMock.mockResolvedValue({
      id: "existing-user-id",
    });

    await expect(
      registerUser({
        username: "existinguser",
        password: "ValidPassword2026!",
      }),
    ).rejects.toMatchObject({
      code: "USERNAME_TAKEN",
      message: "Username is already taken.",
    });

    expect(findUniqueMock).toHaveBeenCalledOnce();
    expect(hashMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });
});

describe("Register - Database Unique Constraint", () => {
  it("rejects registration when the database detects a duplicate username", async () => {
    findUniqueMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("$argon2id$test-hash");
    createMock.mockRejectedValue({
      code: "P2002",
    });

    await expect(
      registerUser({
        username: "duplicateuser",
        password: "ValidPassword2026!",
      }),
    ).rejects.toMatchObject({
      code: "USERNAME_TAKEN",
      message: "Username is already taken.",
    });

    expect(findUniqueMock).toHaveBeenCalledOnce();
    expect(hashMock).toHaveBeenCalledOnce();
    expect(createMock).toHaveBeenCalledOnce();
  });
});

describe("Register - Unexpected Database Error", () => {
  it("propagates unexpected database errors", async () => {
    const databaseError = new Error("Database connection failed");

    findUniqueMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("$argon2id$test-hash");
    createMock.mockRejectedValue(databaseError);

    await expect(
      registerUser({
        username: "validusername",
        password: "ValidPassword2026!",
      }),
    ).rejects.toBe(databaseError);

    expect(findUniqueMock).toHaveBeenCalledOnce();
    expect(hashMock).toHaveBeenCalledOnce();
    expect(createMock).toHaveBeenCalledOnce();
  });
});
