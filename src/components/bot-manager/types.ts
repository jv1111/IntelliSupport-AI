export interface BotProduct {
  id: string;
  name: string;
  model: string;
  description: string;
  visual: "router" | "camera" | "doorbell";
}

export interface AutoReplyGroup {
  id: string;
  productId: string;
  name: string;
}

export interface AutoReply {
  id: string;
  productId: string;
  groupId?: string;
  parentId?: string;
  question: string;
  answer: string;
  active: boolean;
}

export interface AutoReplyFormValues {
  productId: string;
  groupId: string;
  question: string;
  answer: string;
  newGroupName: string;
}

export type BotManagerView = "products" | "questions" | "followups" | "form";
