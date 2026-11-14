import type {
  ArticleCategoryTag,
  ArticleScope,
  ProductStatus,
} from "@/generated/prisma/enums";

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  scope: ArticleScope;
  categoryTag: ArticleCategoryTag;
  status: ProductStatus;
  context: string;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeBaseArticleInput = Pick<
  KnowledgeBaseArticle,
  "title" | "scope" | "categoryTag" | "context"
> & {
  status?: ProductStatus;
};

export type KnowledgeBaseFilter = "all" | ArticleScope;

export type KnowledgeBaseStatus = ProductStatus;

export interface KnowledgeBaseArticlePage {
  items: KnowledgeBaseArticle[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
