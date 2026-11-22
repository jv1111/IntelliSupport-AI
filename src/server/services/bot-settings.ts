import "server-only";

import { z } from "zod";
import { formatValidationErrors } from "@/lib/validations/format-validation-errors";
import { prisma } from "@/server/db/prisma";

const botSettingsSelect = {
  aiEnabled: true,
  autoRepliesEnabled: true,
} as const;

const updateBotSettingsSchema = z
  .object({
    aiEnabled: z.boolean().optional(),
    autoRepliesEnabled: z.boolean().optional(),
  })
  .refine(
    (input) =>
      input.aiEnabled !== undefined || input.autoRepliesEnabled !== undefined,
    "At least one bot setting must be provided.",
  );

export class BotSettingsError extends Error {
  constructor(
    public readonly code: "INVALID_INPUT",
    message: string,
  ) {
    super(message);
    this.name = "BotSettingsError";
  }
}

export async function getBotSettings(userId: string) {
  const settings = await prisma.botSettings.findUnique({
    where: { userId },
    select: botSettingsSelect,
  });

  return (
    settings ?? {
      aiEnabled: true,
      autoRepliesEnabled: true,
    }
  );
}

export async function updateBotSettings(userId: string, input: unknown) {
  const validationResult = updateBotSettingsSchema.safeParse(input);

  if (!validationResult.success) {
    throw new BotSettingsError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  return prisma.botSettings.upsert({
    where: { userId },
    update: validationResult.data,
    create: {
      user: {
        connect: { id: userId },
      },
      ...validationResult.data,
    },
    select: botSettingsSelect,
  });
}
