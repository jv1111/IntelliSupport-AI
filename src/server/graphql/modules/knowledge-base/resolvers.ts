import "server-only";
import { throwGraphQLError } from "@/server/graphql/shared/throw-graphql-error";

import {
  type ArticleCategoryTag as ArticleCategoryTagValue,
  type ArticleScope as ArticleScopeValue,
  type ProductStatus as ProductStatusValue,
} from "@/generated/prisma/enums";
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
  status?: ProductStatusValue;
}

interface UpdateKnowledgeBaseArticleInput {
  scope?: ArticleScopeValue;
  categoryTag?: ArticleCategoryTagValue;
  title?: string;
  context?: string;
  status?: ProductStatusValue;
}

type KnowledgeBaseArticleResult = Awaited<
  ReturnType<typeof createKnowledgeBaseArticle>
>;

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
        throwGraphQLError(error, "Unable to retrieve Knowledge Base article.", [
          KnowledgeBaseArticleError,
        ]);
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
        status?: ProductStatusValue | null;
      },
      context: GraphQLContext,
    ): Promise<Awaited<ReturnType<typeof getKnowledgeBaseArticles>>> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await getKnowledgeBaseArticles(user.id, args);
      } catch (error) {
        throwGraphQLError(
          error,
          "Unable to retrieve Knowledge Base articles.",
          [KnowledgeBaseArticleError],
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
        throwGraphQLError(error, "Unable to create Knowledge Base article.", [
          KnowledgeBaseArticleError,
        ]);
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
        throwGraphQLError(error, "Unable to update Knowledge Base article.", [
          KnowledgeBaseArticleError,
        ]);
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
        throwGraphQLError(error, "Unable to delete Knowledge Base article.", [
          KnowledgeBaseArticleError,
        ]);
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
