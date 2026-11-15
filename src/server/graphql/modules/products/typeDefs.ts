import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { ProductStatus } from "@/generated/prisma/enums";

export const productTypeDefs = `#graphql
  enum ProductStatus {
    ${Object.values(ProductStatus).join("\n    ")}
  }

  type ProductImageUploadField {
    name: String!
    value: String!
  }

  type ProductImageUpload {
    imageKey: String!
    uploadUrl: String!
    fields: [ProductImageUploadField!]!
  }

  type Product {
    id: ID!
    name: String!
    sku: String!
    status: ProductStatus!
    imageUrl: String
    description: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateProductInput {
    name: String!
    sku: String
    status: ProductStatus
    imageKey: String
    description: String
  }

  input UpdateProductInput {
    name: String
    sku: String
    status: ProductStatus
    imageKey: String
    description: String
  }

  type ProductPage {
    items: [Product!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  extend type Query {
    product(id: ID!): Product!

    products(
      page: Int = 1
      limit: Int = ${DEFAULT_PAGE_SIZE}
      search: String
      status: ProductStatus
    ): ProductPage!
  }

  extend type Mutation {
    requestProductImageUpload(
      contentType: String!
      size: Int!
    ): ProductImageUpload!

    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
`;
