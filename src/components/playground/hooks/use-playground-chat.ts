"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { sendGeminiMessage } from "@/lib/gemini";
import type { AutoReply } from "@/lib/auto-replies/types";

export interface PlaygroundChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  provider?: "gemini";
}

export function usePlaygroundChat(
  productId: string,
  productName: string,
  autoReplies: AutoReply[],
  autoRepliesEnabled: boolean,
) {
  const messageIdRef = useRef(0);
  const geminiRequestIdRef = useRef(0);

  const [messageDraft, setMessageDraft] = useState("");
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [hasSelectedReply, setHasSelectedReply] = useState(false);
  const [suggestionsSuppressed, setSuggestionsSuppressed] = useState(false);
  const [showResolutionPrompt, setShowResolutionPrompt] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  const createMessageId = useCallback(() => {
    messageIdRef.current += 1;
    return `playground-message-${messageIdRef.current}`;
  }, []);

  const greeting = `Hello! I'm here to help you with ${productName}. What would you like to know?`;

  const [messages, setMessages] = useState<PlaygroundChatMessage[]>([
    {
      id: "playground-greeting",
      role: "assistant",
      content: greeting,
    },
  ]);

  const suggestedReplies = useMemo(() => {
    if (
      !autoRepliesEnabled ||
      suggestionsSuppressed ||
      (hasSelectedReply && activeParentId === null)
    ) {
      return [];
    }

    return autoReplies
      .filter((reply) => reply.parentId === activeParentId)
      .sort(
        (first, second) =>
          first.position - second.position || first.id.localeCompare(second.id),
      );
  }, [
    activeParentId,
    autoReplies,
    autoRepliesEnabled,
    hasSelectedReply,
    suggestionsSuppressed,
  ]);

  const appendReply = useCallback(
    (reply: AutoReply, customerMessage: string) => {
      const userMessageId = createMessageId();
      const assistantMessageId = createMessageId();

      setMessages((current) => [
        ...current,
        {
          id: userMessageId,
          role: "user",
          content: customerMessage,
        },
        {
          id: assistantMessageId,
          role: "assistant",
          content: reply.answer,
        },
      ]);

      const hasFollowUps = autoReplies.some(
        (item) => item.parentId === reply.id,
      );

      setHasSelectedReply(true);
      setActiveParentId(hasFollowUps ? reply.id : null);
      setShowResolutionPrompt(!hasFollowUps);
    },
    [autoReplies, createMessageId],
  );

  const selectReply = useCallback(
    (reply: AutoReply) => {
      if (
        !autoRepliesEnabled ||
        !suggestedReplies.some((item) => item.id === reply.id)
      ) {
        return;
      }

      appendReply(reply, reply.message);
    },
    [appendReply, autoRepliesEnabled, suggestedReplies],
  );

  const sendMessage = useCallback(async () => {
    const customerMessage = messageDraft.trim();

    if (!customerMessage || isSending) {
      return;
    }

    const requestId = ++geminiRequestIdRef.current;
    const userMessageId = createMessageId();

    setMessageDraft("");
    setSuggestionsSuppressed(true);
    setShowResolutionPrompt(false);
    setGeminiError(null);
    setIsSending(true);

    setMessages((current) => [
      ...current,
      {
        id: userMessageId,
        role: "user",
        content: customerMessage,
      },
    ]);

    try {
      const response = await sendGeminiMessage({
        message: customerMessage,
        productId,
      });

      if (geminiRequestIdRef.current !== requestId) {
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: response.text,
          provider: "gemini",
        },
      ]);
    } catch (error) {
      if (geminiRequestIdRef.current !== requestId) {
        return;
      }

      setGeminiError(
        error instanceof Error
          ? error.message
          : "Unable to get a response from Gemini. Please try again.",
      );
    } finally {
      if (geminiRequestIdRef.current === requestId) {
        setIsSending(false);
      }
    }
  }, [createMessageId, isSending, messageDraft, productId]);

  const answerResolution = useCallback(
    (resolved: boolean) => {
      if (!showResolutionPrompt) {
        return;
      }

      const userMessageId = createMessageId();
      const assistantMessageId = createMessageId();

      setMessages((current) => [
        ...current,
        {
          id: userMessageId,
          role: "user",
          content: resolved ? "Yes" : "No",
        },
        {
          id: assistantMessageId,
          role: "assistant",
          content: resolved
            ? "I'm glad I could help! You can still type another message anytime."
            : "Thank you for letting us know. A support agent will review your concern and respond as soon as possible.",
        },
      ]);

      setShowResolutionPrompt(false);
    },
    [createMessageId, showResolutionPrompt],
  );

  const restart = useCallback(() => {
    geminiRequestIdRef.current += 1;

    setMessages([
      {
        id: "playground-greeting",
        role: "assistant",
        content: greeting,
      },
    ]);

    setActiveParentId(null);
    setHasSelectedReply(false);
    setSuggestionsSuppressed(false);
    setShowResolutionPrompt(false);
    setMessageDraft("");
    setIsSending(false);
    setGeminiError(null);
  }, [greeting]);

  const hasAutoReplies = autoReplies.length > 0;

  return {
    messages,
    messageDraft,
    setMessageDraft,
    suggestedReplies,
    hasAutoReplies,
    showResolutionPrompt,
    isInputDisabled: isSending,
    isSending,
    geminiError,
    sendMessage,
    selectReply,
    answerResolution,
    restart,
  };
}
