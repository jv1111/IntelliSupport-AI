// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlaygroundChat } from "@/components/playground/hooks/use-playground-chat";
import { usePlaygroundProducts } from "@/components/playground/hooks/use-playground-products";
import type { AutoReply } from "@/lib/auto-replies/types";
import type { Product } from "@/lib/products/types";

const { fetchAllProductsMock, sendGeminiMessageMock } = vi.hoisted(() => ({
  fetchAllProductsMock: vi.fn(),
  sendGeminiMessageMock: vi.fn(),
}));

vi.mock("@/lib/products", () => ({
  fetchAllProducts: fetchAllProductsMock,
}));

vi.mock("@/lib/gemini", () => ({
  sendGeminiMessage: sendGeminiMessageMock,
}));

const productA: Product = {
  id: "product-a-id",
  name: "Router X200",
  sku: "SKU-X200",
  status: "published",
  imageUrl: null,
  description: "Wireless router with mesh support.",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const productB: Product = {
  ...productA,
  id: "product-b-id",
  name: "Camera C100",
  sku: "SKU-C100",
};

const rootReply: AutoReply = {
  id: "reply-root",
  productId: productA.id,
  parentId: null,
  message: "How do I reset the router?",
  answer: "Hold the reset button for 10 seconds.",
  position: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const secondRootReply: AutoReply = {
  id: "reply-root-2",
  productId: productA.id,
  parentId: null,
  message: "What is the Wi-Fi coverage range?",
  answer: "The router covers up to 2500 square feet.",
  position: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const followUpReply: AutoReply = {
  id: "reply-follow-up",
  productId: productA.id,
  parentId: rootReply.id,
  message: "What if the router does not restart?",
  answer: "Disconnect the power adapter and reconnect it after 30 seconds.",
  position: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const autoReplies = [rootReply, secondRootReply, followUpReply];

beforeEach(() => {
  vi.clearAllMocks();

  sendGeminiMessageMock.mockResolvedValue({
    text: "Gemini response",
    model: "gemini-3.5-flash-lite",
  });
});

describe("Playground Products - Loading", () => {
  it("loads products successfully", async () => {
    fetchAllProductsMock.mockResolvedValue([productA, productB]);

    const { result } = renderHook(() => usePlaygroundProducts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.products).toEqual([productA, productB]);
    expect(result.current.error).toBeNull();
    expect(fetchAllProductsMock).toHaveBeenCalledOnce();
  });

  it("starts with an empty product list", () => {
    fetchAllProductsMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => usePlaygroundProducts());

    expect(result.current.products).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("reports an error when product loading fails", async () => {
    fetchAllProductsMock.mockRejectedValue(
      new Error("Unable to load products."),
    );

    const { result } = renderHook(() => usePlaygroundProducts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.products).toEqual([]);
    expect(result.current.error).toBe("Unable to load products.");
  });

  it("uses the fallback error message for unexpected failures", async () => {
    fetchAllProductsMock.mockRejectedValue("Unexpected failure");

    const { result } = renderHook(() => usePlaygroundProducts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(
      "Unable to load products. Please try again.",
    );
  });

  it("clears the previous error when retrying", async () => {
    fetchAllProductsMock
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce([productA]);

    const { result } = renderHook(() => usePlaygroundProducts());

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
    });

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.products).toEqual([productA]);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(fetchAllProductsMock).toHaveBeenCalledTimes(2);
  });

  it("reloads products when retry is called", async () => {
    fetchAllProductsMock
      .mockResolvedValueOnce([productA])
      .mockResolvedValueOnce([productB]);

    const { result } = renderHook(() => usePlaygroundProducts());

    await waitFor(() => {
      expect(result.current.products).toEqual([productA]);
    });

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.products).toEqual([productB]);
    });

    expect(fetchAllProductsMock).toHaveBeenCalledTimes(2);
  });
});

describe("Playground Chat - Initial State", () => {
  it("displays a product-specific greeting", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    expect(result.current.messages).toEqual([
      {
        id: "playground-greeting",
        role: "assistant",
        content:
          "Hello! I'm here to help you with Router X200. What would you like to know?",
      },
    ]);
  });

  it("displays root suggestions ordered by position", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    expect(result.current.suggestedReplies).toEqual([
      secondRootReply,
      rootReply,
    ]);
  });

  it("reports when automatic replies are available", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    expect(result.current.hasAutoReplies).toBe(true);
    expect(result.current.isInputDisabled).toBe(false);
  });

  it("keeps the message input available when automatic replies are unavailable", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, [], true),
    );

    expect(result.current.hasAutoReplies).toBe(false);
    expect(result.current.suggestedReplies).toEqual([]);
    expect(result.current.isInputDisabled).toBe(false);
  });
});

describe("Playground Chat - Suggested Messages", () => {
  it("adds user and assistant messages when selecting a suggested message", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.selectReply(rootReply);
    });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[1]).toMatchObject({
      role: "user",
      content: rootReply.message,
    });
    expect(result.current.messages[2]).toMatchObject({
      role: "assistant",
      content: rootReply.answer,
    });
  });

  it("displays follow-up suggestions after selecting a parent message", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.selectReply(rootReply);
    });

    expect(result.current.suggestedReplies).toEqual([followUpReply]);
    expect(result.current.showResolutionPrompt).toBe(false);
  });

  it("displays the resolution prompt after selecting a message without follow-ups", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.selectReply(secondRootReply);
    });

    expect(result.current.suggestedReplies).toEqual([]);
    expect(result.current.showResolutionPrompt).toBe(true);
  });

  it("ignores a message that is not currently suggested", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.selectReply(followUpReply);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.suggestedReplies).toHaveLength(2);
  });

  it("completes a nested conversation through follow-up messages", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.selectReply(rootReply);
    });

    expect(result.current.suggestedReplies).toEqual([followUpReply]);

    act(() => {
      result.current.selectReply(followUpReply);
    });

    expect(result.current.messages).toHaveLength(5);
    expect(result.current.messages[3]).toMatchObject({
      role: "user",
      content: followUpReply.message,
    });
    expect(result.current.messages[4]).toMatchObject({
      role: "assistant",
      content: followUpReply.answer,
    });
    expect(result.current.suggestedReplies).toEqual([]);
    expect(result.current.showResolutionPrompt).toBe(true);
  });
});

describe("Playground Chat - Typed Messages", () => {
  it("sends typed messages to Gemini and displays its response", async () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.setMessageDraft("hello");
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(sendGeminiMessageMock).toHaveBeenCalledWith({
      message: "hello",
      productId: productA.id,
    });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[1]).toMatchObject({
      role: "user",
      content: "hello",
    });
    expect(result.current.messages[2]).toMatchObject({
      role: "assistant",
      content: "Gemini response",
      provider: "gemini",
    });
    expect(result.current.isSending).toBe(false);
    expect(result.current.geminiError).toBeNull();
  });

  it("sends trimmed messages to Gemini", async () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.setMessageDraft("  hello   Gemini  ");
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(sendGeminiMessageMock).toHaveBeenCalledWith({
      message: "hello   Gemini",
      productId: productA.id,
    });
  });

  it("clears the message draft after sending", async () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.setMessageDraft("hello");
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.messageDraft).toBe("");
  });

  it("suppresses suggested messages after sending a typed message", async () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.setMessageDraft("hello");
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.suggestedReplies).toEqual([]);
  });

  it("uses Gemini for typed messages that match an automatic reply message", async () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.setMessageDraft(rootReply.message);
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(sendGeminiMessageMock).toHaveBeenCalledWith({
      message: rootReply.message,
      productId: productA.id,
    });
    expect(result.current.messages[2]).toMatchObject({
      role: "assistant",
      provider: "gemini",
      content: "Gemini response",
    });
  });

  it("reports Gemini request errors", async () => {
    sendGeminiMessageMock.mockRejectedValueOnce(
      new Error("Gemini request failed."),
    );

    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.setMessageDraft("hello");
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.geminiError).toBe("Gemini request failed.");
    expect(result.current.isSending).toBe(false);
  });

  it("does not send an empty message", async () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(sendGeminiMessageMock).not.toHaveBeenCalled();
  });

  it("does not send a whitespace-only message", async () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.setMessageDraft("   ");
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messageDraft).toBe("   ");
    expect(sendGeminiMessageMock).not.toHaveBeenCalled();
  });
});
describe("Playground Chat - Automatic Replies Disabled", () => {
  it("hides suggested messages when automatic replies are disabled", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, false),
    );

    expect(result.current.suggestedReplies).toEqual([]);
  });

  it("keeps the message input enabled when automatic replies are disabled", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, false),
    );

    expect(result.current.isInputDisabled).toBe(false);
  });

  it("sends typed messages to Gemini when automatic replies are disabled", async () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, false),
    );

    act(() => {
      result.current.setMessageDraft("hello");
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(sendGeminiMessageMock).toHaveBeenCalledWith({
      message: "hello",
      productId: productA.id,
    });
    expect(result.current.messages[2]).toMatchObject({
      role: "assistant",
      provider: "gemini",
      content: "Gemini response",
    });
  });

  it("does not select a suggested message when automatic replies are disabled", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, false),
    );

    act(() => {
      result.current.selectReply(rootReply);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.showResolutionPrompt).toBe(false);
  });

  it("allows Gemini messages when no automatic replies are configured", async () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, [], true),
    );

    act(() => {
      result.current.setMessageDraft("hello");
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.isInputDisabled).toBe(false);
    expect(sendGeminiMessageMock).toHaveBeenCalledWith({
      message: "hello",
      productId: productA.id,
    });
    expect(result.current.messages[2]).toMatchObject({
      role: "assistant",
      provider: "gemini",
    });
  });
});
describe("Playground Chat - Resolution Feedback", () => {
  it("adds a positive resolution response", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.selectReply(secondRootReply);
    });

    act(() => {
      result.current.answerResolution(true);
    });

    expect(result.current.messages.slice(-2)).toEqual([
      expect.objectContaining({
        role: "user",
        content: "Yes",
      }),
      expect.objectContaining({
        role: "assistant",
        content:
          "I'm glad I could help! You can still type another message anytime.",
      }),
    ]);

    expect(result.current.showResolutionPrompt).toBe(false);
  });

  it("adds a negative resolution response", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.selectReply(secondRootReply);
    });

    act(() => {
      result.current.answerResolution(false);
    });

    expect(result.current.messages.slice(-2)).toEqual([
      expect.objectContaining({
        role: "user",
        content: "No",
      }),
      expect.objectContaining({
        role: "assistant",
        content:
          "Thank you for letting us know. A support agent will review your concern and respond as soon as possible.",
      }),
    ]);

    expect(result.current.showResolutionPrompt).toBe(false);
  });

  it("ignores resolution feedback when the prompt is not visible", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.answerResolution(true);
    });

    expect(result.current.messages).toHaveLength(1);
  });
});

describe("Playground Chat - Restart Conversation", () => {
  it("resets messages and restores the initial greeting", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.selectReply(rootReply);
    });

    act(() => {
      result.current.restart();
    });

    expect(result.current.messages).toEqual([
      {
        id: "playground-greeting",
        role: "assistant",
        content:
          "Hello! I'm here to help you with Router X200. What would you like to know?",
      },
    ]);
  });

  it("restores the root suggested messages after restarting", async () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.setMessageDraft("Unknown message");
    });

    await act(async () => {
      await result.current.sendMessage();
    });

    expect(result.current.suggestedReplies).toEqual([]);

    act(() => {
      result.current.restart();
    });

    expect(result.current.suggestedReplies).toEqual([
      secondRootReply,
      rootReply,
    ]);
  });

  it("clears the message draft after restarting", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.setMessageDraft("Pending message");
    });

    act(() => {
      result.current.restart();
    });

    expect(result.current.messageDraft).toBe("");
  });

  it("clears the resolution prompt after restarting", () => {
    const { result } = renderHook(() =>
      usePlaygroundChat(productA.id, productA.name, autoReplies, true),
    );

    act(() => {
      result.current.selectReply(secondRootReply);
    });

    expect(result.current.showResolutionPrompt).toBe(true);

    act(() => {
      result.current.restart();
    });

    expect(result.current.showResolutionPrompt).toBe(false);
  });
});
