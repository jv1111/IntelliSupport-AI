import "server-only";
import { throwGraphQLError } from "@/server/graphql/shared/throw-graphql-error";

import { type ProductStatus as ProductStatusValue } from "@/generated/prisma/enums";
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
        throwGraphQLError(error, "Unable to retrieve product.", [
          ProductError,
          ProductImageStorageError,
        ]);
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
        throwGraphQLError(error, "Unable to retrieve products.", [
          ProductError,
          ProductImageStorageError,
        ]);
      }
    },
  },

  Mutation: {
    createProduct: async (
      _parent: unknown,
      args: { input: CreateProductInput },
      context: GraphQLContext,
    ): Promise<ProductResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await createProduct(user.id, args.input);
      } catch (error) {
        throwGraphQLError(error, "Unable to create product.", [
          ProductError,
          ProductImageStorageError,
        ]);
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
        throwGraphQLError(error, "Unable to update product.", [
          ProductError,
          ProductImageStorageError,
        ]);
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
        throwGraphQLError(error, "Unable to delete product.", [
          ProductError,
          ProductImageStorageError,
        ]);
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
