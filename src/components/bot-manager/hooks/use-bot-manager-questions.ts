"use client";

import { useSyncExternalStore } from "react";
import {
  addBotManagerFollowUp,
  addBotManagerQuestion,
  getBotManagerQuestionsSnapshot,
  moveBotManagerQuestion,
  removeBotManagerQuestion,
  subscribeToBotManagerQuestions,
  updateBotManagerQuestion,
} from "@/components/bot-manager/question-editor-store";

export function useBotManagerQuestions() {
  const snapshot = useSyncExternalStore(
    subscribeToBotManagerQuestions,
    getBotManagerQuestionsSnapshot,
    getBotManagerQuestionsSnapshot,
  );

  return {
    questions: snapshot.questions,
    addQuestion: addBotManagerQuestion,
    addFollowUp: addBotManagerFollowUp,
    updateQuestion: updateBotManagerQuestion,
    removeQuestion: removeBotManagerQuestion,
    moveQuestion: moveBotManagerQuestion,
  };
}
