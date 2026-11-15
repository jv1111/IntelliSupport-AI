import { ProductStatus } from "@/generated/prisma/enums";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { PRODUCT_FIELD_LIMITS } from "@/lib/products/constants";
import { z } from "zod";

const productNameSchema = z
  .string()
  .trim()
  .min(1, "Product name is required.")
  .max(
    PRODUCT_FIELD_LIMITS.name,
    `Product name must not exceed ${PRODUCT_FIELD_LIMITS.name} characters.`,
  );

const productSkuSchema = z
  .string()
  .trim()
  .max(
    PRODUCT_FIELD_LIMITS.sku,
    `SKU must not exceed ${PRODUCT_FIELD_LIMITS.sku} characters.`,
  );

const productDescriptionSchema = z
  .string()
  .trim()
  .max(
    PRODUCT_FIELD_LIMITS.description,
    `Description must not exceed ${PRODUCT_FIELD_LIMITS.description} characters.`,
  );

const productStatusSchema = z.enum(ProductStatus);

export const listProductsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z
    .number()
    .int()
    .min(1)
    .max(DEFAULT_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  search: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || undefined),
  status: productStatusSchema
    .nullish()
    .transform((value) => value ?? undefined),
});

export const createProductSchema = z.object({
  name: productNameSchema,
  sku: productSkuSchema
    .optional()
    .transform((value) => value || "Not specified"),
  status: productStatusSchema.default("draft"),
  imageKey: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((value) => value || null),
  description: productDescriptionSchema
    .optional()
    .transform((value) => value || "No description provided."),
});

export const updateProductSchema = z
  .object({
    name: productNameSchema.optional(),
    sku: productSkuSchema
      .optional()
      .transform((value) =>
        value === undefined ? undefined : value || "Not specified",
      ),
    status: productStatusSchema.optional(),
    imageKey: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((value) => (value === undefined ? undefined : value || null)),
    description: productDescriptionSchema
      .optional()
      .transform((value) =>
        value === undefined ? undefined : value || "No description provided.",
      ),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    "At least one product field must be provided.",
  );

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export type ListProductsInput = z.infer<typeof listProductsSchema>;
