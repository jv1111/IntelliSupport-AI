export interface BotManagerMessage {
  id: string;
  message: string;
  answer: string;
  followUps?: BotManagerMessage[];
}

export const botManagerMessages: Record<string, BotManagerMessage[]> = {
  "PROD-101": [
    {
      id: "Q-101",
      message: "How do I reset the router?",
      answer:
        "Hold the reset button for 10 seconds until the LED blinks white, then wait 2 minutes for it to restart.",
      followUps: [
        {
          id: "FQ-101",
          message: "What if the router does not restart after resetting?",
          answer:
            "Disconnect the power adapter, wait 30 seconds, reconnect it, and allow the router to boot completely.",
          followUps: [
            {
              id: "FQ-101-A",
              message: "How long should I wait for the router to boot?",
              answer:
                "Allow approximately 2 minutes for the router to complete its startup process.",
            },
          ],
        },
        {
          id: "FQ-102",
          message: "Will resetting erase my Wi-Fi settings?",
          answer:
            "Yes. A factory reset restores the default network name and password printed on the router label.",
        },
      ],
    },
    {
      id: "Q-102",
      message: "What is the Wi-Fi coverage range?",
      answer: "The X200 covers up to 2500 sq ft with mesh coverage.",
      followUps: [],
    },
  ],
  "PROD-102": [
    {
      id: "Q-103",
      message: "Is the camera waterproof?",
      answer: "Yes, it is IP66 weatherproof and safe for outdoor use.",
      followUps: [],
    },
  ],
  "PROD-103": [],
};

export interface BotManagerMessageMatch {
  productId: string;
  message: BotManagerMessage;
  parentId: string | null;
}

function findMessageInTree(
  messages: BotManagerMessage[],
  autoReplyId: string,
  productId: string,
  parentId: string | null = null,
): BotManagerMessageMatch | null {
  for (const message of messages) {
    if (message.id === autoReplyId) {
      return { productId, message, parentId };
    }

    const match = findMessageInTree(
      message.followUps ?? [],
      autoReplyId,
      productId,
      message.id,
    );

    if (match) {
      return match;
    }
  }

  return null;
}

export function findBotManagerMessage(
  autoReplyId: string,
  questionsByProduct: Record<
    string,
    BotManagerMessage[]
  > = botManagerMessages,
): BotManagerMessageMatch | null {
  for (const [productId, messages] of Object.entries(questionsByProduct)) {
    const match = findMessageInTree(messages, autoReplyId, productId);

    if (match) {
      return match;
    }
  }

  return null;
}
