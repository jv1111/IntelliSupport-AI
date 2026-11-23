// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KnowledgeBaseEditor } from "@/components/knowledge-base/knowledge-base-editor";

const { routerState, editorState, useKnowledgeBaseEditorMock } = vi.hoisted(
  () => {
    const editorState = {
      article: null as { id?: string; title: string } | null,
      products: [] as never[],
      isLoadingProducts: false,
      productsError: null as string | null,
      isLoading: false,
      loadError: null as string | null,
      isSaving: false,
      actionError: null as string | null,
      isArchiveOpen: false,
      closeEditor: vi.fn(),
      saveArticle: vi.fn(async () => true),
      openArchiveConfirmation: vi.fn(),
      closeArchiveConfirmation: vi.fn(),
      archiveArticle: vi.fn(),
      unarchiveArticle: vi.fn(),
      publishArticle: vi.fn(),
    };

    return {
      routerState: {
        bfcacheId: "initial-session",
      },
      editorState,
      useKnowledgeBaseEditorMock: vi.fn(() => editorState),
    };
  },
);

vi.mock("next/navigation", () => ({
  useRouter: () => routerState,
}));

vi.mock("@/components/knowledge-base/hooks/use-knowledge-base-editor", () => ({
  useKnowledgeBaseEditor: useKnowledgeBaseEditorMock,
}));

vi.mock("@/components/knowledge-base/article-form", async () => {
  const React = await import("react");
  const { useFormDraft } = await import("@/hooks/use-form-draft");

  function MockArticleForm({
    article,
  }: {
    article: { id?: string; title: string } | null;
  }) {
    const { values, saveDraft } = useFormDraft({
      formId: "knowledge-base",
      entityId: article?.id,
      initialValues: { title: article?.title ?? "" },
    });

    return React.createElement("input", {
      "aria-label": "Article title",
      value: values.title,
      onChange: (event: { currentTarget: HTMLInputElement }) =>
        saveDraft({ title: event.currentTarget.value }),
    });
  }

  return { ArticleForm: MockArticleForm };
});

vi.mock("@/components/ui/confirmation-dialog", () => ({
  ConfirmationDialog: () => null,
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();

  routerState.bfcacheId = "initial-session";
  editorState.article = null;
  editorState.isLoading = false;
  editorState.loadError = null;
});

describe("Knowledge Base Editor - Session Reset", () => {
  it("restores a new article draft on a fresh editor session", () => {
    const { rerender } = render(createElement(KnowledgeBaseEditor));

    const titleInput = screen.getByRole("textbox", {
      name: "Article title",
    }) as HTMLInputElement;

    fireEvent.change(titleInput, {
      target: { value: "Unsaved article title" },
    });

    expect(titleInput.value).toBe("Unsaved article title");

    routerState.bfcacheId = "new-editor-session";

    rerender(createElement(KnowledgeBaseEditor));

    const resetInput = screen.getByRole("textbox", {
      name: "Article title",
    }) as HTMLInputElement;

    expect(resetInput.value).toBe("Unsaved article title");
    expect(useKnowledgeBaseEditorMock).toHaveBeenCalledTimes(2);
  });

  it("reinitializes an existing article with its saved data", () => {
    editorState.article = {
      id: "article-1",
      title: "Saved article title",
    };

    const { rerender } = render(
      createElement(KnowledgeBaseEditor, { articleId: "article-1" }),
    );

    const titleInput = screen.getByRole("textbox", {
      name: "Article title",
    }) as HTMLInputElement;

    expect(titleInput.value).toBe("Saved article title");

    fireEvent.change(titleInput, {
      target: { value: "Unsaved changes" },
    });

    routerState.bfcacheId = "updated-editor-session";

    rerender(createElement(KnowledgeBaseEditor, { articleId: "article-1" }));

    const resetInput = screen.getByRole("textbox", {
      name: "Article title",
    }) as HTMLInputElement;

    expect(resetInput.value).toBe("Unsaved changes");
    expect(useKnowledgeBaseEditorMock).toHaveBeenCalledTimes(2);
  });

  it("preserves editor state when the navigation session is unchanged", () => {
    const { rerender } = render(createElement(KnowledgeBaseEditor));

    const titleInput = screen.getByRole("textbox", {
      name: "Article title",
    }) as HTMLInputElement;

    fireEvent.change(titleInput, {
      target: { value: "Preserved article title" },
    });

    rerender(createElement(KnowledgeBaseEditor));

    const preservedInput = screen.getByRole("textbox", {
      name: "Article title",
    }) as HTMLInputElement;

    expect(preservedInput.value).toBe("Preserved article title");
  });
});
