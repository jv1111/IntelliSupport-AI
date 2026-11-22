export interface PlaygroundSuggestedQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface PlaygroundChatData {
  assistantMessage: string;
  suggestedQuestions: PlaygroundSuggestedQuestion[];
  sampleUserMessage: string;
}

export const playgroundChatData: Record<string, PlaygroundChatData> = {
  "playground-product-001": {
    assistantMessage:
      "Hello! Welcome. I'm here to help you with our Everyday Wireless Headphones. What would you like to know?",
    sampleUserMessage: "How long does the battery last?",
    suggestedQuestions: [
      {
        id: "Q-001",
        question: "How long does the battery last?",
        answer: "Up to 30 hours of playback on a full charge.",
      },
      {
        id: "Q-002",
        question: "Does it support noise cancellation?",
        answer: "Yes, these headphones feature active noise cancellation.",
      },
      {
        id: "Q-003",
        question: "Can I connect to multiple devices?",
        answer: "Yes, they support Bluetooth multipoint connectivity.",
      },
      {
        id: "Q-004",
        question: "What is included in the box?",
        answer: "Headphones, a charging cable, and a user guide.",
      },
    ],
  },

  "playground-product-002": {
    assistantMessage:
      "Hi there! I'm your Smart Fitness Watch assistant. What would you like to know?",
    sampleUserMessage: "Can it track my heart rate?",
    suggestedQuestions: [
      {
        id: "Q-005",
        question: "Is the watch water-resistant?",
        answer: "It is designed for everyday water resistance.",
      },
      {
        id: "Q-006",
        question: "Can it track my heart rate?",
        answer: "Yes, it includes continuous heart rate monitoring.",
      },
      {
        id: "Q-007",
        question: "Does it support phone notifications?",
        answer: "Yes, compatible smartphone notifications appear on the watch.",
      },
      {
        id: "Q-008",
        question: "How long does the battery last?",
        answer: "Battery life depends on usage and tracking features.",
      },
    ],
  },

  "playground-product-003": {
    assistantMessage:
      "Welcome! I'm here to help you with your Portable Bluetooth Speaker.",
    sampleUserMessage: "Can I pair two speakers together?",
    suggestedQuestions: [
      {
        id: "Q-009",
        question: "How long does the battery last?",
        answer: "Battery life varies depending on volume and usage.",
      },
      {
        id: "Q-010",
        question: "Is the speaker waterproof?",
        answer:
          "Check the product specifications for its water-resistance rating.",
      },
      {
        id: "Q-011",
        question: "Can I pair two speakers together?",
        answer: "Pairing support depends on the supported Bluetooth features.",
      },
      {
        id: "Q-012",
        question: "Can I use it while charging?",
        answer: "Yes, it can be used while connected to its charger.",
      },
    ],
  },

  "playground-product-004": {
    assistantMessage:
      "Hello! I'm your Ergonomic Desk Lamp assistant. Ask me anything about its features.",
    sampleUserMessage: "Can I adjust the brightness?",
    suggestedQuestions: [
      {
        id: "Q-013",
        question: "Can I adjust the brightness?",
        answer: "Yes, the lamp supports adjustable brightness.",
      },
      {
        id: "Q-014",
        question: "Does it have different color temperatures?",
        answer: "Available lighting modes depend on the lamp configuration.",
      },
      {
        id: "Q-015",
        question: "Is the lamp USB-powered?",
        answer: "Check the product specifications for its power input.",
      },
      {
        id: "Q-016",
        question: "Can I adjust the lamp angle?",
        answer: "Yes, its design allows adjustment of the lighting position.",
      },
    ],
  },
};
