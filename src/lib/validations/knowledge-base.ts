import { ArticleCategoryTag, ArticleScope } from "@/generated/prisma/enums";
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

export const listKnowledgeBaseArticlesSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(15).default(15),
  search: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || undefined),
  scope: articleScopeSchema.nullish().transform((value) => value ?? undefined),
  categoryTag: articleCategoryTagSchema
    .nullish()
    .transform((value) => value ?? undefined),
});

export const createKnowledgeBaseArticleSchema = z.object({
  scope: articleScopeSchema,
  categoryTag: articleCategoryTagSchema,
  title: articleTitleSchema,
  context: articleContextSchema,
});

export const updateKnowledgeBaseArticleSchema = z
  .object({
    scope: articleScopeSchema.optional(),
    categoryTag: articleCategoryTagSchema.optional(),
    title: articleTitleSchema.optional(),
    context: articleContextSchema.optional(),
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
