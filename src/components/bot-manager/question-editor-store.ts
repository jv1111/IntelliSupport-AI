import {
  botManagerMessages,
  findBotManagerMessage,
  type BotManagerMessage,
} from "@/components/bot-manager/question-editor-data";

type MessageDirection = "up" | "down";

const listeners = new Set<() => void>();

let version = 0;

let snapshot = {
  version,
  messages: botManagerMessages,
};

function notifyListeners() {
  version += 1;
  snapshot = {
    version,
    messages: botManagerMessages,
  };
  listeners.forEach((listener) => listener());
}

function createAutoReplyId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function findMessageList(
  messages: BotManagerMessage[],
  autoReplyId: string,
): { items: BotManagerMessage[]; index: number } | null {
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];

    if (message.id === autoReplyId) {
      return { items: messages, index };
    }

    const match = findMessageList(message.followUps ?? [], autoReplyId);

    if (match) {
      return match;
    }
  }

  return null;
}

export function subscribeToBotManagerMessages(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getBotManagerMessagesSnapshot() {
  return snapshot;
}

export function addBotManagerMessage(productId: string) {
  const messages = (botManagerMessages[productId] ??= []);

  const message: BotManagerMessage = {
    id: createAutoReplyId("Q"),
    message: "",
    answer: "",
    followUps: [],
  };

  messages.push(message);
  notifyListeners();

  return message;
}

export function addBotManagerFollowUp(parentAutoReplyId: string) {
  const match = findBotManagerMessage(parentAutoReplyId);

  if (!match) {
    return null;
  }

  const message: BotManagerMessage = {
    id: createAutoReplyId("FQ"),
    message: "",
    answer: "",
    followUps: [],
  };

  match.message.followUps ??= [];
  match.message.followUps.push(message);
  notifyListeners();

  return message;
}

export function updateBotManagerMessage(
  autoReplyId: string,
  message: string,
  answer: string,
) {
  const match = findBotManagerMessage(autoReplyId);

  if (!match) {
    return false;
  }

  match.message.message = message;
  match.message.answer = answer;
  notifyListeners();

  return true;
}

export function removeBotManagerMessage(autoReplyId: string) {
  for (const messages of Object.values(botManagerMessages)) {
    const match = findMessageList(messages, autoReplyId);

    if (match) {
      match.items.splice(match.index, 1);
      notifyListeners();
      return true;
    }
  }

  return false;
}

export function moveBotManagerMessage(
  autoReplyId: string,
  direction: MessageDirection,
) {
  for (const messages of Object.values(botManagerMessages)) {
    const match = findMessageList(messages, autoReplyId);

    if (!match) {
      continue;
    }

    const targetIndex = direction === "up" ? match.index - 1 : match.index + 1;

    if (targetIndex < 0 || targetIndex >= match.items.length) {
      return false;
    }

    [match.items[match.index], match.items[targetIndex]] = [
      match.items[targetIndex],
      match.items[match.index],
    ];

    notifyListeners();
    return true;
  }

  return false;
}
