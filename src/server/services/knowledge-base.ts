import "server-only";

import { z } from "zod";
import {
  createKnowledgeBaseArticleSchema,
  listKnowledgeBaseArticlesSchema,
  updateKnowledgeBaseArticleSchema,
} from "@/lib/validations/knowledge-base";
import { formatValidationErrors } from "@/lib/validations/format-validation-errors";
import { createPaginationMetadata } from "@/lib/pagination";
import { prisma } from "@/server/db/prisma";

const knowledgeBaseArticleIdSchema = z
  .string()
  .trim()
  .min(1, "Knowledge Base article ID is required.");

const knowledgeBaseArticleSelect = {
  id: true,
  scope: true,
  categoryTag: true,
  status: true,
  title: true,
  context: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class KnowledgeBaseArticleError extends Error {
  constructor(
    public readonly code:
      "INVALID_INPUT" | "NOT_FOUND" | "INVALID_STATUS_TRANSITION",
    message: string,
  ) {
    super(message);
    this.name = "KnowledgeBaseArticleError";
  }
}

function validateKnowledgeBaseArticleId(articleId: string): string {
  const result = knowledgeBaseArticleIdSchema.safeParse(articleId);

  if (!result.success) {
    throw new KnowledgeBaseArticleError(
      "INVALID_INPUT",
      formatValidationErrors(result.error),
    );
  }

  return result.data;
}

export async function getKnowledgeBaseArticles(userId: string, input: unknown) {
  const validationResult = listKnowledgeBaseArticlesSchema.safeParse(input);

  if (!validationResult.success) {
    throw new KnowledgeBaseArticleError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const { page, limit, search, scope, categoryTag, status } =
    validationResult.data;

  const where = {
    userId,
    ...(scope ? { scope } : {}),
    ...(categoryTag ? { categoryTag } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          title: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const [items, totalCount] = await prisma.$transaction([
    prisma.knowledgeBaseArticle.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: knowledgeBaseArticleSelect,
    }),
    prisma.knowledgeBaseArticle.count({ where }),
  ]);

  return {
    items,
    ...createPaginationMetadata(page, limit, totalCount),
  };
}

export async function getKnowledgeBaseArticle(
  userId: string,
  articleId: string,
) {
  const id = validateKnowledgeBaseArticleId(articleId);

  const article = await prisma.knowledgeBaseArticle.findFirst({
    where: {
      id,
      userId,
    },
    select: knowledgeBaseArticleSelect,
  });

  if (!article) {
    throw new KnowledgeBaseArticleError(
      "NOT_FOUND",
      "Knowledge Base article not found.",
    );
  }

  return article;
}

export async function createKnowledgeBaseArticle(
  userId: string,
  input: unknown,
) {
  const validationResult = createKnowledgeBaseArticleSchema.safeParse(input);

  if (!validationResult.success) {
    throw new KnowledgeBaseArticleError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  return prisma.knowledgeBaseArticle.create({
    data: {
      ...validationResult.data,
      user: {
        connect: {
          id: userId,
        },
      },
    },
    select: knowledgeBaseArticleSelect,
  });
}

export async function updateKnowledgeBaseArticle(
  userId: string,
  articleId: string,
  input: unknown,
) {
  const id = validateKnowledgeBaseArticleId(articleId);
  const validationResult = updateKnowledgeBaseArticleSchema.safeParse(input);

  if (!validationResult.success) {
    throw new KnowledgeBaseArticleError(
      "INVALID_INPUT",
      formatValidationErrors(validationResult.error),
    );
  }

  const [article] = await prisma.knowledgeBaseArticle.updateManyAndReturn({
    where: {
      id,
      userId,
      ...(validationResult.data.status === "archived"
        ? { status: "published" as const }
        : {}),
    },
    data: validationResult.data,
    select: knowledgeBaseArticleSelect,
  });

  if (!article) {
    if (validationResult.data.status === "archived") {
      const existingArticle = await prisma.knowledgeBaseArticle.findFirst({
        where: { id, userId },
        select: { status: true },
      });

      if (existingArticle) {
        throw new KnowledgeBaseArticleError(
          "INVALID_STATUS_TRANSITION",
          "Only published articles can be archived.",
        );
      }
    }

    throw new KnowledgeBaseArticleError(
      "NOT_FOUND",
      "Knowledge Base article not found.",
    );
  }

  return article;
}

export async function deleteKnowledgeBaseArticle(
  userId: string,
  articleId: string,
): Promise<boolean> {
  const id = validateKnowledgeBaseArticleId(articleId);

  const result = await prisma.knowledgeBaseArticle.deleteMany({
    where: {
      id,
      userId,
      status: "archived",
    },
  });

  if (result.count === 0) {
    const existingArticle = await prisma.knowledgeBaseArticle.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (existingArticle) {
      throw new KnowledgeBaseArticleError(
        "INVALID_STATUS_TRANSITION",
        "Only archived articles can be deleted.",
      );
    }

    throw new KnowledgeBaseArticleError(
      "NOT_FOUND",
      "Knowledge Base article not found.",
    );
  }

  return true;
}
