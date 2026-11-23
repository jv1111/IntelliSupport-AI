// @vitest-environment jsdom

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useKnowledgeBaseEditor } from "@/components/knowledge-base/hooks/use-knowledge-base-editor";
import type { Product } from "@/lib/products/types";

const {
  fetchAllProductsMock,
  fetchKnowledgeBaseArticleMock,
  createKnowledgeBaseArticleMock,
  updateKnowledgeBaseArticleMock,
  routerPushMock,
  routerReplaceMock,
} = vi.hoisted(() => ({
  fetchAllProductsMock: vi.fn(),
  fetchKnowledgeBaseArticleMock: vi.fn(),
  createKnowledgeBaseArticleMock: vi.fn(),
  updateKnowledgeBaseArticleMock: vi.fn(),
  routerPushMock: vi.fn(),
  routerReplaceMock: vi.fn(),
}));

vi.mock("@/lib/products", () => ({
  fetchAllProducts: fetchAllProductsMock,
}));

vi.mock("@/lib/knowledge-base", () => ({
  fetchKnowledgeBaseArticle: fetchKnowledgeBaseArticleMock,
  createKnowledgeBaseArticle: createKnowledgeBaseArticleMock,
  updateKnowledgeBaseArticle: updateKnowledgeBaseArticleMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
    replace: routerReplaceMock,
  }),
}));

const publishedProduct: Product = {
  id: "product-published",
  name: "Published Router",
  sku: "SKU-001",
  status: "published",
  imageUrl: null,
  description: "Published product description.",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const archivedProduct: Product = {
  ...publishedProduct,
  id: "product-archived",
  name: "Archived Router",
  sku: "SKU-002",
  status: "archived",
};

const draftProduct: Product = {
  ...publishedProduct,
  id: "product-draft",
  name: "Draft Router",
  sku: "SKU-003",
  status: "draft",
};

beforeEach(() => {
  vi.clearAllMocks();

  fetchAllProductsMock.mockResolvedValue([
    publishedProduct,
    draftProduct,
    archivedProduct,
  ]);
});

describe("Knowledge Base Editor - Product Loading", () => {
  it("loads published and archived products but excludes drafts", async () => {
    const { result } = renderHook(() => useKnowledgeBaseEditor());

    expect(result.current.isLoadingProducts).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingProducts).toBe(false);
    });

    expect(result.current.products).toEqual([
      publishedProduct,
      archivedProduct,
    ]);

    expect(
      result.current.products.some((product) => product.status === "draft"),
    ).toBe(false);

    expect(fetchAllProductsMock).toHaveBeenCalledOnce();
    expect(result.current.productsError).toBeNull();
  });

  it("returns an empty product list when no products exist", async () => {
    fetchAllProductsMock.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useKnowledgeBaseEditor());

    await waitFor(() => {
      expect(result.current.isLoadingProducts).toBe(false);
    });

    expect(result.current.products).toEqual([]);
    expect(result.current.productsError).toBeNull();
  });

  it("reports product loading errors", async () => {
    fetchAllProductsMock.mockRejectedValueOnce(
      new Error("Unable to retrieve products."),
    );

    const { result } = renderHook(() => useKnowledgeBaseEditor());

    await waitFor(() => {
      expect(result.current.isLoadingProducts).toBe(false);
    });

    expect(result.current.products).toEqual([]);
    expect(result.current.productsError).toBe("Unable to retrieve products.");
  });

  it("uses a fallback message for unexpected loading errors", async () => {
    fetchAllProductsMock.mockRejectedValueOnce("Unexpected failure");

    const { result } = renderHook(() => useKnowledgeBaseEditor());

    await waitFor(() => {
      expect(result.current.isLoadingProducts).toBe(false);
    });

    expect(result.current.productsError).toBe(
      "Unable to load products. Please try again.",
    );
  });
});
