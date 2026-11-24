import {
  ArticleCategoryTag,
  ArticleScope,
  ProductStatus,
} from "@/generated/prisma/enums";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { z } from "zod";

const articleTitleSchema = z
  .string()
  .trim()
  .min(1, "Article title is required.");

const articleContextSchema = z
  .string()
  .trim()
  .min(1, "Article context is required.");

const articleScopeSchema = z.enum(ArticleScope);
const articleCategoryTagSchema = z.enum(ArticleCategoryTag);
const articleStatusSchema = z.enum(ProductStatus);

export const listKnowledgeBaseArticlesSchema = z.object({
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
  scope: articleScopeSchema.nullish().transform((value) => value ?? undefined),
  categoryTag: articleCategoryTagSchema
    .nullish()
    .transform((value) => value ?? undefined),
  status: articleStatusSchema
    .nullish()
    .transform((value) => value ?? undefined),
});

export const createKnowledgeBaseArticleSchema = z.object({
  scope: articleScopeSchema,
  categoryTag: articleCategoryTagSchema,
  title: articleTitleSchema,
  context: articleContextSchema,
  productId: z.string().trim().min(1, "Product ID is required.").optional(),
  status: articleStatusSchema.default("draft"),
});

export const updateKnowledgeBaseArticleSchema = z
  .object({
    scope: articleScopeSchema.optional(),
    categoryTag: articleCategoryTagSchema.optional(),
    title: articleTitleSchema.optional(),
    context: articleContextSchema.optional(),
    productId: z.string().trim().min(1, "Product ID is required.").optional(),
    status: articleStatusSchema.optional(),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    "At least one article field must be provided.",
  );

export type CreateKnowledgeBaseArticleInput = z.infer<
  typeof createKnowledgeBaseArticleSchema
>;

export type UpdateKnowledgeBaseArticleInput = z.infer<
  typeof updateKnowledgeBaseArticleSchema
>;

export type ListKnowledgeBaseArticlesInput = z.infer<
  typeof listKnowledgeBaseArticlesSchema
>;
