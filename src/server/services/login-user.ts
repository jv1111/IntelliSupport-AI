import "server-only";

import argon2 from "argon2";
import { loginCredentialsSchema } from "@/lib/validations/auth";
import { formatValidationErrors } from "@/lib/validations/format-validation-errors";
import { prisma } from "@/server/db/prisma";

export class LoginError extends Error {
  constructor(
    public readonly code: "INVALID_INPUT" | "INVALID_CREDENTIALS",
    message: string,
  ) {
    super(message);
    this.name = "LoginError";
  }
}

export async function loginUser(input: unknown) {
  const validationResult = loginCredentialsSchema.safeParse(input);

  if (!validationResult.success) {
    throw new LoginError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const { username, password } = validationResult.data;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  if (!user || !(await argon2.verify(user.passwordHash, password))) {
    throw new LoginError(
      "INVALID_CREDENTIALS",
      "Invalid username or password.",
    );
  }

  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };
}
