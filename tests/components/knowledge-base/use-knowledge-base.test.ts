// @vitest-environment jsdom

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useKnowledgeBase } from "@/components/knowledge-base/hooks/use-knowledge-base";
import type { KnowledgeBaseStatus } from "@/lib/knowledge-base/types";

const { fetchKnowledgeBaseArticlesMock, routerState } = vi.hoisted(() => ({
  fetchKnowledgeBaseArticlesMock: vi.fn(),
  routerState: {
    bfcacheId: "initial",
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    bfcacheId: routerState.bfcacheId,
  }),
}));

vi.mock("@/lib/knowledge-base", () => ({
  deleteKnowledgeBaseArticle: vi.fn(),
  fetchKnowledgeBaseArticles: fetchKnowledgeBaseArticlesMock,
  updateKnowledgeBaseArticle: vi.fn(),
}));

const emptyPage = {
  items: [],
  totalCount: 0,
  totalPages: 0,
  currentPage: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

beforeEach(() => {
  vi.clearAllMocks();

  routerState.bfcacheId = "initial";

  fetchKnowledgeBaseArticlesMock.mockResolvedValue(emptyPage);
});

describe("Knowledge Base List - Navigation Refresh", () => {
  it("reloads articles after fresh navigation even when status is unchanged", async () => {
    const { result, rerender } = renderHook(
      ({ initialStatus }) => useKnowledgeBase(initialStatus),
      {
        initialProps: {
          initialStatus: "published" as const,
        },
      },
    );

    await waitFor(() => {
      expect(fetchKnowledgeBaseArticlesMock).toHaveBeenCalledTimes(1);
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchKnowledgeBaseArticlesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        status: "published",
      }),
    );

    // Simulate returning to the Knowledge Base through fresh navigation.
    routerState.bfcacheId = "after-article-creation";

    rerender({
      initialStatus: "published",
    });

    await waitFor(() => {
      expect(fetchKnowledgeBaseArticlesMock).toHaveBeenCalledTimes(2);
    });

    expect(fetchKnowledgeBaseArticlesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        status: "published",
      }),
    );
  });

  it("synchronizes the selected status when the route status changes", async () => {
    const { result, rerender } = renderHook(
      ({ initialStatus }: { initialStatus: KnowledgeBaseStatus }) =>
        useKnowledgeBase(initialStatus),
      {
        initialProps: {
          initialStatus: "published" as KnowledgeBaseStatus,
        },
      },
    );

    await waitFor(() => {
      expect(fetchKnowledgeBaseArticlesMock).toHaveBeenCalledTimes(1);
      expect(result.current.isLoading).toBe(false);
    });

    routerState.bfcacheId = "after-draft-creation";

    rerender({
      initialStatus: "draft",
    });

    await waitFor(() => {
      expect(result.current.status).toBe("draft");
    });

    await waitFor(() => {
      expect(fetchKnowledgeBaseArticlesMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          status: "draft",
        }),
      );
    });
  });
});
