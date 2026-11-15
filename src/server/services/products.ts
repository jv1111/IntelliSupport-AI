import "server-only";

import { z } from "zod";
import {
  createProductSchema,
  listProductsSchema,
  updateProductSchema,
} from "@/lib/validations/product";
import { formatValidationErrors } from "@/lib/validations/format-validation-errors";
import { createPaginationMetadata } from "@/lib/pagination";
import { prisma } from "@/server/db/prisma";
import { verifyProductImage } from "@/server/storage/google-cloud-storage";

const productIdSchema = z.string().trim().min(1, "Product ID is required.");

const productSelect = {
  id: true,
  name: true,
  sku: true,
  status: true,
  imageUrl: true,
  description: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class ProductError extends Error {
  constructor(
    public readonly code:
      "INVALID_INPUT" | "NOT_FOUND" | "INVALID_STATUS_TRANSITION",
    message: string,
  ) {
    super(message);
    this.name = "ProductError";
  }
}

function validateProductId(productId: string): string {
  const result = productIdSchema.safeParse(productId);

  if (!result.success) {
    throw new ProductError(
      "INVALID_INPUT",
      formatValidationErrors(result.error),
    );
  }

  return result.data;
}

async function validateProductImageKey(
  imageKey: string | null | undefined,
  userId: string,
): Promise<void> {
  if (imageKey == null) {
    return;
  }

  await verifyProductImage(userId, imageKey);
}

export async function getProducts(userId: string, input: unknown) {
  const validationResult = listProductsSchema.safeParse(input);

  if (!validationResult.success) {
    throw new ProductError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const { page, limit, search, status } = validationResult.data;

  const where = {
    userId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const [items, totalCount] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: productSelect,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    ...createPaginationMetadata(page, limit, totalCount),
  };
}

export async function getProduct(userId: string, productId: string) {
  const id = validateProductId(productId);

  const product = await prisma.product.findFirst({
    where: {
      id,
      userId,
    },
    select: productSelect,
  });

  if (!product) {
    throw new ProductError("NOT_FOUND", "Product not found.");
  }

  return product;
}

export async function createProduct(userId: string, input: unknown) {
  const validationResult = createProductSchema.safeParse(input);

  if (!validationResult.success) {
    throw new ProductError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const { imageKey, ...productData } = validationResult.data;

  await validateProductImageKey(imageKey, userId);

  return prisma.product.create({
    data: {
      ...productData,
      imageUrl: imageKey ?? null,
      user: {
        connect: {
          id: userId,
        },
      },
    },
    select: productSelect,
  });
}

export async function updateProduct(
  userId: string,
  productId: string,
  input: unknown,
) {
  const id = validateProductId(productId);
  const validationResult = updateProductSchema.safeParse(input);

  if (!validationResult.success) {
    throw new ProductError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const { imageKey, ...productData } = validationResult.data;

  await validateProductImageKey(imageKey, userId);

  const [product] = await prisma.product.updateManyAndReturn({
    where: {
      id,
      userId,
      ...(validationResult.data.status === "archived"
        ? { status: "published" as const }
        : {}),
    },
    data: {
      ...productData,
      ...(imageKey !== undefined ? { imageUrl: imageKey } : {}),
    },
    select: productSelect,
  });

  if (!product && validationResult.data.status === "archived") {
    const existingProduct = await prisma.product.findFirst({
      where: { id, userId },
      select: { status: true },
    });

    if (existingProduct) {
      throw new ProductError(
        "INVALID_STATUS_TRANSITION",
        "Only published products can be archived.",
      );
    }
  }

  if (!product) {
    throw new ProductError("NOT_FOUND", "Product not found.");
  }

  return product;
}

export async function deleteProduct(
  userId: string,
  productId: string,
): Promise<boolean> {
  const id = validateProductId(productId);

  const result = await prisma.product.deleteMany({
    where: {
      id,
      userId,
      status: "archived",
    },
  });

  if (result.count === 0) {
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (existingProduct) {
      throw new ProductError(
        "INVALID_STATUS_TRANSITION",
        "Only archived products can be deleted.",
      );
    }

    throw new ProductError("NOT_FOUND", "Product not found.");
  }

  return true;
}
