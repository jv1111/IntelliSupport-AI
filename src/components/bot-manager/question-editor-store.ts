import {
  botManagerQuestions,
  findBotManagerQuestion,
  type BotManagerQuestion,
} from "@/components/bot-manager/question-editor-data";

type QuestionDirection = "up" | "down";

const listeners = new Set<() => void>();

let version = 0;

let snapshot = {
  version,
  questions: botManagerQuestions,
};

function notifyListeners() {
  version += 1;
  snapshot = {
    version,
    questions: botManagerQuestions,
  };
  listeners.forEach((listener) => listener());
}

function createQuestionId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function findQuestionList(
  questions: BotManagerQuestion[],
  questionId: string,
): { items: BotManagerQuestion[]; index: number } | null {
  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];

    if (question.id === questionId) {
      return { items: questions, index };
    }

    const match = findQuestionList(question.followUps ?? [], questionId);

    if (match) {
      return match;
    }
  }

  return null;
}

export function subscribeToBotManagerQuestions(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getBotManagerQuestionsSnapshot() {
  return snapshot;
}

export function addBotManagerQuestion(productId: string) {
  const questions = (botManagerQuestions[productId] ??= []);

  const question: BotManagerQuestion = {
    id: createQuestionId("Q"),
    question: "",
    answer: "",
    followUps: [],
  };

  questions.push(question);
  notifyListeners();

  return question;
}

export function addBotManagerFollowUp(parentQuestionId: string) {
  const match = findBotManagerQuestion(parentQuestionId);

  if (!match) {
    return null;
  }

  const question: BotManagerQuestion = {
    id: createQuestionId("FQ"),
    question: "",
    answer: "",
    followUps: [],
  };

  match.question.followUps ??= [];
  match.question.followUps.push(question);
  notifyListeners();

  return question;
}

export function updateBotManagerQuestion(
  questionId: string,
  question: string,
  answer: string,
) {
  const match = findBotManagerQuestion(questionId);

  if (!match) {
    return false;
  }

  match.question.question = question;
  match.question.answer = answer;
  notifyListeners();

  return true;
}

export function removeBotManagerQuestion(questionId: string) {
  for (const questions of Object.values(botManagerQuestions)) {
    const match = findQuestionList(questions, questionId);

    if (match) {
      match.items.splice(match.index, 1);
      notifyListeners();
      return true;
    }
  }

  return false;
}

export function moveBotManagerQuestion(
  questionId: string,
  direction: QuestionDirection,
) {
  for (const questions of Object.values(botManagerQuestions)) {
    const match = findQuestionList(questions, questionId);

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
