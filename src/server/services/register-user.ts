import "server-only";

import argon2 from "argon2";
import { registerCredentialsSchema } from "@/lib/validations/auth";
import { formatValidationErrors } from "@/lib/validations/format-validation-errors";
import { prisma } from "@/server/db/prisma";

export class RegistrationError extends Error {
  constructor(
    public readonly code: "INVALID_INPUT" | "USERNAME_TAKEN",
    message: string,
  ) {
    super(message);
    this.name = "RegistrationError";
  }
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function registerUser(input: unknown) {
  const validationResult = registerCredentialsSchema.safeParse(input);

  if (!validationResult.success) {
    throw new RegistrationError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const { username, password } = validationResult.data;

  const existingUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existingUser) {
    throw new RegistrationError("USERNAME_TAKEN", "Username is already taken.");
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  try {
    return await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new RegistrationError(
        "USERNAME_TAKEN",
        "Username is already taken.",
      );
    }

    throw error;
  }
}
