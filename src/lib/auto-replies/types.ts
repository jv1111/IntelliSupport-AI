export type AutoReplyMoveDirection = "UP" | "DOWN";

export interface AutoReply {
  id: string;
  productId: string;
  parentId: string | null;
  message: string;
  answer: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutoReplyInput {
  productId: string;
  parentId?: string | null;
  message: string;
  answer: string;
}

export interface UpdateAutoReplyInput {
  message: string;
  answer: string;
}
