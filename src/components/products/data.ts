import type { ProductStatus } from "@/lib/products/types";

export const productStatusLabels: Record<ProductStatus, string> = {
  published: "Published Products",
  draft: "Drafts",
  archived: "Archived",
};
