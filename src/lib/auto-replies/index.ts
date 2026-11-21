import { graphqlRequest } from "@/lib/graphql/client";
import type {
  AutoReply,
  AutoReplyMoveDirection,
  CreateAutoReplyInput,
  UpdateAutoReplyInput,
} from "@/lib/auto-replies/types";

const autoReplyFields = `
  id
  productId
  parentId
  question
  answer
  position
  createdAt
  updatedAt
`;

export async function fetchAutoReplies(
  productId?: string,
): Promise<AutoReply[]> {
  const data = await graphqlRequest<
    { autoReplies: AutoReply[] },
    { productId: string | null }
  >(
    `
      query AutoReplies($productId: ID) {
        autoReplies(productId: $productId) {
          ${autoReplyFields}
        }
      }
    `,
    { productId: productId ?? null },
  );

  return data.autoReplies;
}

export async function createAutoReply(
  input: CreateAutoReplyInput,
): Promise<AutoReply> {
  const data = await graphqlRequest<
    { createAutoReply: AutoReply },
    { input: CreateAutoReplyInput }
  >(
    `
      mutation CreateAutoReply($input: CreateAutoReplyInput!) {
        createAutoReply(input: $input) {
          ${autoReplyFields}
        }
      }
    `,
    { input },
  );

  return data.createAutoReply;
}

export async function updateAutoReply(
  id: string,
  input: UpdateAutoReplyInput,
): Promise<AutoReply> {
  const data = await graphqlRequest<
    { updateAutoReply: AutoReply },
    { id: string; input: UpdateAutoReplyInput }
  >(
    `
      mutation UpdateAutoReply($id: ID!, $input: UpdateAutoReplyInput!) {
        updateAutoReply(id: $id, input: $input) {
          ${autoReplyFields}
        }
      }
    `,
    { id, input },
  );

  return data.updateAutoReply;
}

export async function moveAutoReply(
  id: string,
  direction: AutoReplyMoveDirection,
): Promise<AutoReply> {
  const data = await graphqlRequest<
    { moveAutoReply: AutoReply },
    { id: string; direction: AutoReplyMoveDirection }
  >(
    `
      mutation MoveAutoReply($id: ID!, $direction: AutoReplyMoveDirection!) {
        moveAutoReply(id: $id, direction: $direction) {
          ${autoReplyFields}
        }
      }
    `,
    { id, direction },
  );

  return data.moveAutoReply;
}

export async function deleteAutoReply(id: string): Promise<boolean> {
  const data = await graphqlRequest<
    { deleteAutoReply: boolean },
    { id: string }
  >(
    `
      mutation DeleteAutoReply($id: ID!) {
        deleteAutoReply(id: $id)
      }
    `,
    { id },
  );

  return data.deleteAutoReply;
}
