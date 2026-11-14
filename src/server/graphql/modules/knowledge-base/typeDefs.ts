import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { ArticleCategoryTag, ArticleScope } from "@/generated/prisma/enums";

export const knowledgeBaseTypeDefs = `#graphql
  enum ArticleScope {
    ${Object.values(ArticleScope).join("\n    ")}
  }

  enum ArticleCategoryTag {
    ${Object.values(ArticleCategoryTag).join("\n    ")}
  }

  type KnowledgeBaseArticle {
    id: ID!
    scope: ArticleScope!
    categoryTag: ArticleCategoryTag!
    status: ProductStatus!
    title: String!
    context: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateKnowledgeBaseArticleInput {
    scope: ArticleScope!
    categoryTag: ArticleCategoryTag!
    title: String!
    context: String!
    status: ProductStatus
  }

  input UpdateKnowledgeBaseArticleInput {
    scope: ArticleScope
    categoryTag: ArticleCategoryTag
    title: String
    context: String
    status: ProductStatus
  }

  type KnowledgeBaseArticlePage {
    items: [KnowledgeBaseArticle!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  extend type Query {
    knowledgeBaseArticle(id: ID!): KnowledgeBaseArticle!

    knowledgeBaseArticles(
      page: Int = 1
      limit: Int = ${DEFAULT_PAGE_SIZE}
      search: String
      scope: ArticleScope
      categoryTag: ArticleCategoryTag
      status: ProductStatus
    ): KnowledgeBaseArticlePage!
  }

  extend type Mutation {
    createKnowledgeBaseArticle(
      input: CreateKnowledgeBaseArticleInput!
    ): KnowledgeBaseArticle!

    updateKnowledgeBaseArticle(
      id: ID!
      input: UpdateKnowledgeBaseArticleInput!
    ): KnowledgeBaseArticle!

    deleteKnowledgeBaseArticle(id: ID!): Boolean!
  }
`;
