import { graphqlRequest } from "@/lib/graphql/client";

export type ProductStatus = "published" | "draft" | "archived";

export interface Product {
  id: string;
  name: string;
  sku: string;
  status: ProductStatus;
  imageUrl: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPage {
  items: Product[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductInput {
  name: string;
  sku?: string;
  status?: ProductStatus;
  imageUrl?: string | null;
  description?: string;
}

export type ProductUpdateInput = Partial<ProductInput>;

type ProductsVariables = Record<string, unknown> & {
  page: number;
  limit: number;
  search: string | null;
  status: ProductStatus | null;
};

const productFields = `
  id
  name
  sku
  status
  imageUrl
  description
  createdAt
  updatedAt
`;

export async function fetchProduct(id: string): Promise<Product> {
  const data = await graphqlRequest<{ product: Product }, { id: string }>(
    `
      query Product($id: ID!) {
        product(id: $id) {
          ${productFields}
        }
      }
    `,
    { id },
  );

  return data.product;
}

export async function fetchProducts(
  variables: ProductsVariables,
): Promise<ProductPage> {
  const data = await graphqlRequest<
    { products: ProductPage },
    ProductsVariables
  >(
    `
      query Products(
        $page: Int!
        $limit: Int!
        $search: String
        $status: ProductStatus
      ) {
        products(
          page: $page
          limit: $limit
          search: $search
          status: $status
        ) {
          items {
            ${productFields}
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

  return data.products;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const data = await graphqlRequest<
    { createProduct: Product },
    { input: ProductInput }
  >(
    `
      mutation CreateProduct($input: CreateProductInput!) {
        createProduct(input: $input) {
          ${productFields}
        }
      }
    `,
    { input },
  );

  return data.createProduct;
}

export async function updateProduct(
  id: string,
  input: ProductUpdateInput,
): Promise<Product> {
  const data = await graphqlRequest<
    { updateProduct: Product },
    { id: string; input: ProductUpdateInput }
  >(
    `
      mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
        updateProduct(id: $id, input: $input) {
          ${productFields}
        }
      }
    `,
    { id, input },
  );

  return data.updateProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteProduct: boolean }, { id: string }>(
    `
      mutation DeleteProduct($id: ID!) {
        deleteProduct(id: $id)
      }
    `,
    { id },
  );

  return data.deleteProduct;
}
