import "server-only";

import {
  type ArticleCategoryTag as ArticleCategoryTagValue,
  type ArticleScope as ArticleScopeValue,
} from "@/generated/prisma/enums";
import { GraphQLError } from "graphql";
import {
  KnowledgeBaseArticleError,
  createKnowledgeBaseArticle,
  getKnowledgeBaseArticle,
  getKnowledgeBaseArticles,
  updateKnowledgeBaseArticle,
  deleteKnowledgeBaseArticle,
} from "@/server/services/knowledge-base";
import { requireAuthenticatedUser } from "@/server/graphql/shared/require-authenticated-user";
import type { GraphQLContext } from "@/server/graphql/context";

interface CreateKnowledgeBaseArticleInput {
  scope: ArticleScopeValue;
  categoryTag: ArticleCategoryTagValue;
  title: string;
  context: string;
}

interface UpdateKnowledgeBaseArticleInput {
  scope?: ArticleScopeValue;
  categoryTag?: ArticleCategoryTagValue;
  title?: string;
  context?: string;
}

type KnowledgeBaseArticleResult = Awaited<
  ReturnType<typeof createKnowledgeBaseArticle>
>;

function throwKnowledgeBaseArticleGraphQLError(
  error: unknown,
  fallbackMessage: string,
): never {
  if (error instanceof KnowledgeBaseArticleError) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: error.code,
      },
    });
  }

  throw new GraphQLError(fallbackMessage, {
    extensions: {
      code: "INTERNAL_SERVER_ERROR",
    },
  });
}

export const knowledgeBaseResolvers = {
  Query: {
    knowledgeBaseArticle: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ): Promise<KnowledgeBaseArticleResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await getKnowledgeBaseArticle(user.id, args.id);
      } catch (error) {
        throwKnowledgeBaseArticleGraphQLError(
          error,
          "Unable to retrieve Knowledge Base article.",
        );
      }
    },

    knowledgeBaseArticles: async (
      _parent: unknown,
      args: {
        page?: number;
        limit?: number;
        search?: string | null;
        scope?: ArticleScopeValue | null;
        categoryTag?: ArticleCategoryTagValue | null;
      },
      context: GraphQLContext,
    ): Promise<Awaited<ReturnType<typeof getKnowledgeBaseArticles>>> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await getKnowledgeBaseArticles(user.id, args);
      } catch (error) {
        throwKnowledgeBaseArticleGraphQLError(
          error,
          "Unable to retrieve Knowledge Base articles.",
        );
      }
    },
  },

  Mutation: {
    createKnowledgeBaseArticle: async (
      _parent: unknown,
      args: { input: CreateKnowledgeBaseArticleInput },
      context: GraphQLContext,
    ): Promise<KnowledgeBaseArticleResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await createKnowledgeBaseArticle(user.id, args.input);
      } catch (error) {
        throwKnowledgeBaseArticleGraphQLError(
          error,
          "Unable to create Knowledge Base article.",
        );
      }
    },

    updateKnowledgeBaseArticle: async (
      _parent: unknown,
      args: { id: string; input: UpdateKnowledgeBaseArticleInput },
      context: GraphQLContext,
    ): Promise<KnowledgeBaseArticleResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await updateKnowledgeBaseArticle(user.id, args.id, args.input);
      } catch (error) {
        throwKnowledgeBaseArticleGraphQLError(
          error,
          "Unable to update Knowledge Base article.",
        );
      }
    },

    deleteKnowledgeBaseArticle: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ): Promise<boolean> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await deleteKnowledgeBaseArticle(user.id, args.id);
      } catch (error) {
        throwKnowledgeBaseArticleGraphQLError(
          error,
          "Unable to delete Knowledge Base article.",
        );
      }
    },
  },

  KnowledgeBaseArticle: {
    createdAt: (parent: KnowledgeBaseArticleResult) =>
      parent.createdAt.toISOString(),
    updatedAt: (parent: KnowledgeBaseArticleResult) =>
      parent.updatedAt.toISOString(),
  },
};
