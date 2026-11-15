import "server-only";

import { type ProductStatus as ProductStatusValue } from "@/generated/prisma/enums";
import { GraphQLError } from "graphql";
import {
  ProductError,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getProducts,
} from "@/server/services/products";
import { requireAuthenticatedUser } from "@/server/graphql/shared/require-authenticated-user";
import {
  createProductImageReadUrl,
  createProductImageUploadPolicy,
  ProductImageStorageError,
} from "@/server/storage/google-cloud-storage";
import type { GraphQLContext } from "@/server/graphql/context";

interface CreateProductInput {
  name: string;
  sku?: string;
  status?: ProductStatusValue;
  imageKey?: string | null;
  description?: string;
}

interface UpdateProductInput {
  name?: string;
  sku?: string;
  status?: ProductStatusValue;
  imageKey?: string | null;
  description?: string;
}

type ProductResult = Awaited<ReturnType<typeof createProduct>>;

function throwProductGraphQLError(
  error: unknown,
  fallbackMessage: string,
): never {
  if (error instanceof ProductError) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: error.code,
      },
    });
  }

  if (error instanceof ProductImageStorageError) {
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

export const productResolvers = {
  Query: {
    product: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ): Promise<ProductResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await getProduct(user.id, args.id);
      } catch (error) {
        throwProductGraphQLError(error, "Unable to retrieve product.");
      }
    },

    products: async (
      _parent: unknown,
      args: {
        page?: number;
        limit?: number;
        search?: string | null;
        status?: ProductStatusValue | null;
      },
      context: GraphQLContext,
    ): Promise<Awaited<ReturnType<typeof getProducts>>> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await getProducts(user.id, args);
      } catch (error) {
        throwProductGraphQLError(error, "Unable to retrieve products.");
      }
    },
  },

  Mutation: {
    requestProductImageUpload: async (
      _parent: unknown,
      args: { contentType: string; size: number },
      context: GraphQLContext,
    ) => {
      const user = requireAuthenticatedUser(context);

      try {
        const policy = await createProductImageUploadPolicy(
          user.id,
          args.contentType,
          args.size,
        );

        return {
          imageKey: policy.imageKey,
          uploadUrl: policy.uploadUrl,
          fields: Object.entries(policy.fields).map(([name, value]) => ({
            name,
            value,
          })),
        };
      } catch (error) {
        throwProductGraphQLError(
          error,
          "Unable to authorize product image upload.",
        );
      }
    },

    createProduct: async (
      _parent: unknown,
      args: { input: CreateProductInput },
      context: GraphQLContext,
    ): Promise<ProductResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await createProduct(user.id, args.input);
      } catch (error) {
        throwProductGraphQLError(error, "Unable to create product.");
      }
    },

    updateProduct: async (
      _parent: unknown,
      args: { id: string; input: UpdateProductInput },
      context: GraphQLContext,
    ): Promise<ProductResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await updateProduct(user.id, args.id, args.input);
      } catch (error) {
        throwProductGraphQLError(error, "Unable to update product.");
      }
    },

    deleteProduct: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ): Promise<boolean> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await deleteProduct(user.id, args.id);
      } catch (error) {
        throwProductGraphQLError(error, "Unable to delete product.");
      }
    },
  },

  Product: {
    createdAt: (parent: ProductResult) => parent.createdAt.toISOString(),
    updatedAt: (parent: ProductResult) => parent.updatedAt.toISOString(),
    imageUrl: async (parent: ProductResult): Promise<string | null> => {
      if (!parent.imageUrl) {
        return null;
      }

      try {
        return await createProductImageReadUrl(parent.imageUrl);
      } catch (error) {
        console.error("Unable to generate product image read URL:", {
          productId: parent.id,
          error,
        });

        return null;
      }
    },
  },
};
