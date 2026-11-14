import type {
  ArticleCategoryTag,
  ArticleScope,
} from "@/generated/prisma/enums";
import type { KnowledgeBaseStatus } from "@/lib/knowledge-base/types";

export const articleScopeLabels: Record<ArticleScope, string> = {
  generic: "Generic / Store Policy",
  specific: "Specific Guidance",
};

export const articleCategoryLabels: Record<ArticleCategoryTag, string> = {
  troubleshooting: "Troubleshooting",
  installation_setup: "Installation & Setup",
  others: "Others",
};

export const knowledgeBaseStatusLabels: Record<KnowledgeBaseStatus, string> = {
  published: "Published Articles",
  draft: "Drafts",
  archived: "Archived",
};
