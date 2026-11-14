import { graphqlRequest } from "@/lib/graphql/client";
import type {
  KnowledgeBaseArticle,
  KnowledgeBaseArticleInput,
  KnowledgeBaseArticlePage,
} from "@/lib/knowledge-base/types";
import type {
  ArticleCategoryTag,
  ArticleScope,
  ProductStatus,
} from "@/generated/prisma/enums";

interface KnowledgeBaseArticlesVariables extends Record<string, unknown> {
  page: number;
  limit: number;
  search: string | null;
  scope: ArticleScope | null;
  categoryTag: ArticleCategoryTag | null;
  status?: ProductStatus | null;
}

const articleFields = `
  id
  title
  scope
  categoryTag
  status
  context
  createdAt
  updatedAt
`;

export async function fetchKnowledgeBaseArticles(
  variables: KnowledgeBaseArticlesVariables,
): Promise<KnowledgeBaseArticlePage> {
  const data = await graphqlRequest<
    { knowledgeBaseArticles: KnowledgeBaseArticlePage },
    KnowledgeBaseArticlesVariables
  >(
    `
      query KnowledgeBaseArticles(
        $page: Int!
        $limit: Int!
        $search: String
        $scope: ArticleScope
        $categoryTag: ArticleCategoryTag
        $status: ProductStatus
      ) {
        knowledgeBaseArticles(
          page: $page
          limit: $limit
          search: $search
          scope: $scope
          categoryTag: $categoryTag
          status: $status
        ) {
          items {
            ${articleFields}
          }
          totalCount
          totalPages
          currentPage
          hasNextPage
          hasPreviousPage
        }
      }
    `,
    variables,
  );

  return data.knowledgeBaseArticles;
}

export async function fetchKnowledgeBaseArticle(
  id: string,
): Promise<KnowledgeBaseArticle> {
  const data = await graphqlRequest<
    { knowledgeBaseArticle: KnowledgeBaseArticle },
    { id: string }
  >(
    `
      query KnowledgeBaseArticle($id: ID!) {
        knowledgeBaseArticle(id: $id) {
          ${articleFields}
        }
      }
    `,
    { id },
  );

  return data.knowledgeBaseArticle;
}

export async function createKnowledgeBaseArticle(
  input: KnowledgeBaseArticleInput,
): Promise<KnowledgeBaseArticle> {
  const data = await graphqlRequest<
    { createKnowledgeBaseArticle: KnowledgeBaseArticle },
    { input: KnowledgeBaseArticleInput }
  >(
    `
      mutation CreateKnowledgeBaseArticle(
        $input: CreateKnowledgeBaseArticleInput!
      ) {
        createKnowledgeBaseArticle(input: $input) {
          ${articleFields}
        }
      }
    `,
    { input },
  );

  return data.createKnowledgeBaseArticle;
}

export async function updateKnowledgeBaseArticle(
  id: string,
  input: Partial<KnowledgeBaseArticleInput>,
): Promise<KnowledgeBaseArticle> {
  const data = await graphqlRequest<
    { updateKnowledgeBaseArticle: KnowledgeBaseArticle },
    { id: string; input: Partial<KnowledgeBaseArticleInput> }
  >(
    `
      mutation UpdateKnowledgeBaseArticle(
        $id: ID!
        $input: UpdateKnowledgeBaseArticleInput!
      ) {
        updateKnowledgeBaseArticle(id: $id, input: $input) {
          ${articleFields}
        }
      }
    `,
    { id, input },
  );

  return data.updateKnowledgeBaseArticle;
}

export async function deleteKnowledgeBaseArticle(id: string): Promise<boolean> {
  const data = await graphqlRequest<
    { deleteKnowledgeBaseArticle: boolean },
    { id: string }
  >(
    `
      mutation DeleteKnowledgeBaseArticle($id: ID!) {
        deleteKnowledgeBaseArticle(id: $id)
      }
    `,
    { id },
  );

  return data.deleteKnowledgeBaseArticle;
}
