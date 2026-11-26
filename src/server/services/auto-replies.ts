import "server-only";

import { z } from "zod";
import { MAX_AUTO_REPLIES_PER_LEVEL } from "@/lib/auto-replies/constants";
import { formatValidationErrors } from "@/lib/validations/format-validation-errors";
import {
  createAutoReplySchema,
  updateAutoReplySchema,
} from "@/lib/validations/auto-reply";
import { prisma } from "@/server/db/prisma";

const productIdSchema = z.string().trim().min(1, "Product ID is required.");
const autoReplyIdSchema = z
  .string()
  .trim()
  .min(1, "Auto Reply ID is required.");

const autoReplySelect = {
  id: true,
  productId: true,
  parentId: true,
  message: true,
  answer: true,
  position: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class AutoReplyError extends Error {
  constructor(
    public readonly code: "INVALID_INPUT" | "NOT_FOUND" | "LIMIT_REACHED",
    message: string,
  ) {
    super(message);
    this.name = "AutoReplyError";
  }
}

function validateProductId(productId: string): string {
  const result = productIdSchema.safeParse(productId);

  if (!result.success) {
    throw new AutoReplyError(
      "INVALID_INPUT",
      formatValidationErrors(result.error),
    );
  }

  return result.data;
}

export async function getAutoReplies(userId: string, productId?: string) {
  const id = productId ? validateProductId(productId) : undefined;

  if (id) {
    const product = await prisma.product.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      throw new AutoReplyError("NOT_FOUND", "Product not found.");
    }
  }

  const records = await prisma.autoReply.findMany({
    where: {
      product: {
        is: {
          userId,
        },
      },
      ...(id ? { productId: id } : {}),
    },
    orderBy: [
      { productId: "asc" },
      { parentId: "asc" },
      { position: "asc" },
      { id: "asc" },
    ],
    select: autoReplySelect,
  });

  return records;
}

export async function createAutoReply(userId: string, input: unknown) {
  const validationResult = createAutoReplySchema.safeParse(input);

  if (!validationResult.success) {
    throw new AutoReplyError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const { productId, parentId, message, answer } = validationResult.data;

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    throw new AutoReplyError("NOT_FOUND", "Product not found.");
  }

  if (parentId) {
    const parent = await prisma.autoReply.findFirst({
      where: {
        id: parentId,
        productId,
      },
      select: {
        id: true,
      },
    });

    if (!parent) {
      throw new AutoReplyError("NOT_FOUND", "Parent Auto Reply not found.");
    }
  }

  const siblingsWhere = {
    productId,
    parentId,
  };

  const [siblingCount, lastSibling] = await Promise.all([
    prisma.autoReply.count({
      where: siblingsWhere,
    }),
    prisma.autoReply.findFirst({
      where: siblingsWhere,
      orderBy: {
        position: "desc",
      },
      select: {
        position: true,
      },
    }),
  ]);

  if (siblingCount >= MAX_AUTO_REPLIES_PER_LEVEL) {
    throw new AutoReplyError(
      "LIMIT_REACHED",
      `A maximum of ${MAX_AUTO_REPLIES_PER_LEVEL} messages is allowed at each level.`,
    );
  }

  return prisma.autoReply.create({
    data: {
      productId,
      parentId,
      message,
      answer,
      position: (lastSibling?.position ?? -1) + 1,
    },
    select: autoReplySelect,
  });
}

export async function updateAutoReply(
  userId: string,
  id: string,
  input: unknown,
) {
  const idResult = autoReplyIdSchema.safeParse(id);

  if (!idResult.success) {
    throw new AutoReplyError(
      "INVALID_INPUT",
      formatValidationErrors(idResult.error),
    );
  }

  const validationResult = updateAutoReplySchema.safeParse(input);

  if (!validationResult.success) {
    throw new AutoReplyError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const existingReply = await prisma.autoReply.findFirst({
    where: {
      id: idResult.data,
      product: {
        is: {
          userId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!existingReply) {
    throw new AutoReplyError("NOT_FOUND", "Automatic reply not found.");
  }

  return prisma.autoReply.update({
    where: {
      id: existingReply.id,
    },
    data: validationResult.data,
    select: autoReplySelect,
  });
}

export async function deleteAutoReply(userId: string, id: string) {
  const idResult = autoReplyIdSchema.safeParse(id);

  if (!idResult.success) {
    throw new AutoReplyError(
      "INVALID_INPUT",
      formatValidationErrors(idResult.error),
    );
  }

  const existingReply = await prisma.autoReply.findFirst({
    where: {
      id: idResult.data,
      product: {
        is: {
          userId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!existingReply) {
    throw new AutoReplyError("NOT_FOUND", "Automatic reply not found.");
  }

  await prisma.autoReply.delete({
    where: {
      id: existingReply.id,
    },
  });

  return true;
}

export async function moveAutoReply(
  userId: string,
  id: string,
  direction: "UP" | "DOWN",
) {
  const idResult = autoReplyIdSchema.safeParse(id);

  if (!idResult.success) {
    throw new AutoReplyError(
      "INVALID_INPUT",
      formatValidationErrors(idResult.error),
    );
  }

  const directionResult = z.enum(["UP", "DOWN"]).safeParse(direction);

  if (!directionResult.success) {
    throw new AutoReplyError(
      "INVALID_INPUT",
      formatValidationErrors(directionResult.error),
    );
  }

  return prisma.$transaction(
    async (transaction) => {
      const target = await transaction.autoReply.findFirst({
        where: {
          id: idResult.data,
          product: {
            is: {
              userId,
            },
          },
        },
        select: autoReplySelect,
      });

      if (!target) {
        throw new AutoReplyError("NOT_FOUND", "Automatic reply not found.");
      }

      const siblings = await transaction.autoReply.findMany({
        where: {
          productId: target.productId,
          parentId: target.parentId,
        },
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: {
          id: true,
          position: true,
        },
      });

      const currentIndex = siblings.findIndex((item) => item.id === target.id);

      const nextIndex = currentIndex + (directionResult.data === "UP" ? -1 : 1);

      if (nextIndex < 0 || nextIndex >= siblings.length) {
        return target;
      }

      const reordered = [...siblings];

      [reordered[currentIndex], reordered[nextIndex]] = [
        reordered[nextIndex],
        reordered[currentIndex],
      ];

      await Promise.all(
        reordered.map((item, position) =>
          transaction.autoReply.update({
            where: { id: item.id },
            data: { position },
          }),
        ),
      );

      return transaction.autoReply.findUniqueOrThrow({
        where: { id: target.id },
        select: autoReplySelect,
      });
    },
    {
      isolationLevel: "Serializable",
    },
  );
}
