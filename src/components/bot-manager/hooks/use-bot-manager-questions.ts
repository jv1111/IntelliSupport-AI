"use client";

import { useSyncExternalStore } from "react";
import {
  addBotManagerFollowUp,
  addBotManagerMessage,
  getBotManagerMessagesSnapshot,
  moveBotManagerMessage,
  removeBotManagerMessage,
  subscribeToBotManagerMessages,
  updateBotManagerMessage,
} from "@/components/bot-manager/question-editor-store";

export function useBotManagerMessages() {
  const snapshot = useSyncExternalStore(
    subscribeToBotManagerMessages,
    getBotManagerMessagesSnapshot,
    getBotManagerMessagesSnapshot,
  );

  return {
    messages: snapshot.messages,
    addQuestion: addBotManagerMessage,
    addFollowUp: addBotManagerFollowUp,
    updateQuestion: updateBotManagerMessage,
    removeQuestion: removeBotManagerMessage,
    moveQuestion: moveBotManagerMessage,
  };
}
