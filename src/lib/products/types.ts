import type { ProductStatus } from "@/generated/prisma/enums";

export type { ProductStatus };

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
  imageKey?: string | null;
  description?: string;
}

export type ProductUpdateInput = Partial<ProductInput>;
