import "server-only";

import argon2 from "argon2";
import { changePasswordSchema } from "@/lib/validations/auth";
import { formatValidationErrors } from "@/lib/validations/format-validation-errors";
import { prisma } from "@/server/db/prisma";

export class ChangePasswordError extends Error {
  constructor(
    public readonly code:
      "INVALID_INPUT" | "INVALID_CURRENT_PASSWORD" | "USER_NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "ChangePasswordError";
  }
}

export async function changePassword(
  userId: string,
  input: unknown,
): Promise<void> {
  const validationResult = changePasswordSchema.safeParse(input);

  if (!validationResult.success) {
    throw new ChangePasswordError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const { currentPassword, newPassword } = validationResult.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throw new ChangePasswordError(
      "USER_NOT_FOUND",
      "Account could not be found.",
    );
  }

  const isCurrentPasswordValid = await argon2.verify(
    user.passwordHash,
    currentPassword,
  );

  if (!isCurrentPasswordValid) {
    throw new ChangePasswordError(
      "INVALID_CURRENT_PASSWORD",
      "Your current password is incorrect.",
    );
  }

  const passwordHash = await argon2.hash(newPassword, {
    type: argon2.argon2id,
  });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true },
    }),
    prisma.session.deleteMany({
      where: { userId },
    }),
  ]);
}
