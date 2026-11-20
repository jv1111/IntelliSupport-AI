export interface BotManagerQuestion {
  id: string;
  question: string;
  answer: string;
  followUps?: BotManagerQuestion[];
}

export const botManagerQuestions: Record<string, BotManagerQuestion[]> = {
  "PROD-101": [
    {
      id: "Q-101",
      question: "How do I reset the router?",
      answer:
        "Hold the reset button for 10 seconds until the LED blinks white, then wait 2 minutes for it to restart.",
      followUps: [
        {
          id: "FQ-101",
          question: "What if the router does not restart after resetting?",
          answer:
            "Disconnect the power adapter, wait 30 seconds, reconnect it, and allow the router to boot completely.",
          followUps: [
            {
              id: "FQ-101-A",
              question: "How long should I wait for the router to boot?",
              answer:
                "Allow approximately 2 minutes for the router to complete its startup process.",
            },
          ],
        },
        {
          id: "FQ-102",
          question: "Will resetting erase my Wi-Fi settings?",
          answer:
            "Yes. A factory reset restores the default network name and password printed on the router label.",
        },
      ],
    },
    {
      id: "Q-102",
      question: "What is the Wi-Fi coverage range?",
      answer: "The X200 covers up to 2500 sq ft with mesh coverage.",
      followUps: [],
    },
  ],
  "PROD-102": [
    {
      id: "Q-103",
      question: "Is the camera waterproof?",
      answer: "Yes, it is IP66 weatherproof and safe for outdoor use.",
      followUps: [],
    },
  ],
  "PROD-103": [],
};

export interface BotManagerQuestionMatch {
  productId: string;
  question: BotManagerQuestion;
  parentId: string | null;
}

function findQuestionInTree(
  questions: BotManagerQuestion[],
  questionId: string,
  productId: string,
  parentId: string | null = null,
): BotManagerQuestionMatch | null {
  for (const question of questions) {
    if (question.id === questionId) {
      return { productId, question, parentId };
    }

    const match = findQuestionInTree(
      question.followUps ?? [],
      questionId,
      productId,
      question.id,
    );

    if (match) {
      return match;
    }
  }

  return null;
}

export function findBotManagerQuestion(
  questionId: string,
  questionsByProduct: Record<
    string,
    BotManagerQuestion[]
  > = botManagerQuestions,
): BotManagerQuestionMatch | null {
  for (const [productId, questions] of Object.entries(questionsByProduct)) {
    const match = findQuestionInTree(questions, questionId, productId);

    if (match) {
      return match;
    }
  }

  return null;
}
