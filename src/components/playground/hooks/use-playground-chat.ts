"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { AutoReply } from "@/lib/auto-replies/types";

export interface PlaygroundChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

function normalizeQuestion(question: string): string {
  return question.trim().replace(/\s+/g, " ").toLowerCase();
}

export function usePlaygroundChat(
  productName: string,
  autoReplies: AutoReply[],
  autoRepliesEnabled: boolean,
) {
  const messageIdRef = useRef(0);

  const [messageDraft, setMessageDraft] = useState("");
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [hasSelectedReply, setHasSelectedReply] = useState(false);
  const [suggestionsSuppressed, setSuggestionsSuppressed] = useState(false);
  const [showResolutionPrompt, setShowResolutionPrompt] = useState(false);

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

      // A reply without follow-up questions completes this question path.
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

      appendReply(reply, reply.question);
    },
    [appendReply, autoRepliesEnabled, suggestedReplies],
  );

  const sendMessage = useCallback(() => {
    const customerMessage = messageDraft.trim();

    if (!customerMessage || !autoRepliesEnabled || autoReplies.length === 0) {
      return;
    }

    const normalizedMessage = normalizeQuestion(customerMessage);

    // Match typed messages against the current conversation branch.
    // At the end of a path, activeParentId is null, so root questions
    // can be typed to start another question path.
    const matchedReply = autoReplies.find(
      (reply) =>
        reply.parentId === activeParentId &&
        normalizeQuestion(reply.question) === normalizedMessage,
    );

    setMessageDraft("");

    // Hide suggested-question buttons after a typed message is sent.
    // The customer can continue using the input instead.
    setSuggestionsSuppressed(true);

    if (matchedReply) {
      appendReply(matchedReply, customerMessage);
      return;
    }

    // Keep the customer's message visible without a fallback assistant reply.
    setShowResolutionPrompt(false);

    const userMessageId = createMessageId();

    setMessages((current) => [
      ...current,
      {
        id: userMessageId,
        role: "user",
        content: customerMessage,
      },
    ]);
  }, [
    activeParentId,
    appendReply,
    autoReplies,
    autoRepliesEnabled,
    createMessageId,
    messageDraft,
  ]);

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
            ? "I'm glad I could help! You can still type another question anytime."
            : "Thank you for letting us know. A support agent will review your concern and respond as soon as possible.",
        },
      ]);

      setShowResolutionPrompt(false);
    },
    [createMessageId, showResolutionPrompt],
  );

  const restart = useCallback(() => {
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
  }, [greeting]);

  const hasAutoReplies = autoReplies.length > 0;

  return {
    messages,
    messageDraft,
    setMessageDraft,
    suggestedReplies,
    hasAutoReplies,
    showResolutionPrompt,
    isInputDisabled: !autoRepliesEnabled || !hasAutoReplies,
    sendMessage,
    selectReply,
    answerResolution,
    restart,
  };
}
