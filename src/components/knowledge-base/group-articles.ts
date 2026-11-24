import type { KnowledgeBaseArticle } from "@/lib/knowledge-base/types";

export interface ArticleGroup {
  id: string;
  label: string;
  articles: KnowledgeBaseArticle[];
}

const GENERIC_GROUP_ID = "__generic";
const UNLINKED_GROUP_ID = "__unlinked";
const GENERIC_GROUP_LABEL = "Generic";
const UNKNOWN_PRODUCT_LABEL = "Unknown product";

export function groupArticles(
  articles: KnowledgeBaseArticle[],
  productNames: Map<string, string>,
): ArticleGroup[] {
  const genericArticles: KnowledgeBaseArticle[] = [];
  const articlesByProduct = new Map<string, KnowledgeBaseArticle[]>();

  for (const article of articles) {
    if (article.scope === "generic") {
      genericArticles.push(article);
      continue;
    }

    const groupId = article.productId ?? UNLINKED_GROUP_ID;
    const groupArticlesList = articlesByProduct.get(groupId);

    if (groupArticlesList) {
      groupArticlesList.push(article);
    } else {
      articlesByProduct.set(groupId, [article]);
    }
  }

  const productGroups: ArticleGroup[] = [...articlesByProduct.entries()]
    .map(([id, groupedArticles]) => ({
      id,
      label: productNames.get(id) ?? UNKNOWN_PRODUCT_LABEL,
      articles: groupedArticles,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (genericArticles.length === 0) {
    return productGroups;
  }

  return [
    {
      id: GENERIC_GROUP_ID,
      label: GENERIC_GROUP_LABEL,
      articles: genericArticles,
    },
    ...productGroups,
  ];
}
