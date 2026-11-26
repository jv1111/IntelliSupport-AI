import "server-only";

import { buildProductChatbotSystemPrompt } from "@/server/prompts/product-chatbot-prompt";
import type { AutoReply } from "@/lib/auto-replies/types";
import type { Product } from "@/lib/products/types";
import type { KnowledgeBaseArticle } from "@/lib/knowledge-base/types";
import { getAutoReplies } from "@/server/services/auto-replies";
import { getBotSettings } from "@/server/services/bot-settings";
import { getKnowledgeBaseArticlesForProduct } from "@/server/services/knowledge-base";
import { getProduct } from "@/server/services/products";
import { createProductImageReadUrl } from "@/server/storage/google-cloud-storage";

interface PlaygroundChatData {
  product: Product;
  autoReplies: AutoReply[];
  autoRepliesEnabled: boolean;
}

interface PlaygroundProductData {
  product: Product;
  knowledgeBaseArticles: KnowledgeBaseArticle[];
  botManager: {
    settings: {
      aiEnabled: boolean;
      autoRepliesEnabled: boolean;
    };
    autoReplies: AutoReply[];
  };
}

interface LoadedPlaygroundProductData {
  data: PlaygroundProductData;
  productImageKey: string | null;
}

async function loadPlaygroundProductData(
  userId: string,
  productId: string,
): Promise<LoadedPlaygroundProductData> {
  const productRecord = await getProduct(userId, productId);

  const [autoReplyRecords, knowledgeBaseArticleRecords, botSettings] =
    await Promise.all([
      getAutoReplies(userId, productId),
      getKnowledgeBaseArticlesForProduct(userId, productId),
      getBotSettings(userId),
    ]);

  const product: Product = {
    id: productRecord.id,
    name: productRecord.name,
    sku: productRecord.sku,
    status: productRecord.status,
    imageUrl: null,
    description: productRecord.description,
    createdAt: productRecord.createdAt.toISOString(),
    updatedAt: productRecord.updatedAt.toISOString(),
  };

  const autoReplies: AutoReply[] = autoReplyRecords.map((reply) => ({
    ...reply,
    createdAt: reply.createdAt.toISOString(),
    updatedAt: reply.updatedAt.toISOString(),
  }));

  const knowledgeBaseArticles: KnowledgeBaseArticle[] =
    knowledgeBaseArticleRecords.map((article) => ({
      ...article,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    }));

  return {
    data: {
      product,
      knowledgeBaseArticles: knowledgeBaseArticles.filter(
        (article) => article.status === "published",
      ),
      botManager: {
        settings: botSettings,
        autoReplies,
      },
    },
    productImageKey: productRecord.imageUrl,
  };
}

export async function getPlaygroundChatSystemPrompt(
  userId: string,
  productId: string,
): Promise<string> {
  const { data } = await loadPlaygroundProductData(userId, productId);

  return buildProductChatbotSystemPrompt(data);
}

export async function getPlaygroundChatData(
  userId: string,
  productId: string,
): Promise<PlaygroundChatData> {
  const { data, productImageKey } = await loadPlaygroundProductData(
    userId,
    productId,
  );

  let imageUrl: string | null = null;

  if (productImageKey) {
    try {
      imageUrl = await createProductImageReadUrl(productImageKey);
    } catch (error) {
      console.error("Unable to generate playground product image URL:", {
        productId: data.product.id,
        error,
      });
    }
  }

  const product: Product = {
    ...data.product,
    imageUrl,
  };


  return {
    product,
    autoReplies: data.botManager.autoReplies,
    autoRepliesEnabled: data.botManager.settings.autoRepliesEnabled,
  };
}
