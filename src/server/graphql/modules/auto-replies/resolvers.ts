import "server-only";

import { throwGraphQLError } from "@/server/graphql/shared/throw-graphql-error";
import { requireAuthenticatedUser } from "@/server/graphql/shared/require-authenticated-user";
import {
  AutoReplyError,
  createAutoReply,
  deleteAutoReply,
  getAutoReplies,
  moveAutoReply,
  updateAutoReply,
} from "@/server/services/auto-replies";
import type { GraphQLContext } from "@/server/graphql/context";

interface CreateAutoReplyInput {
  productId: string;
  parentId?: string | null;
  message: string;
  answer: string;
}

interface UpdateAutoReplyInput {
  message: string;
  answer: string;
}

type AutoReplyResult = Awaited<ReturnType<typeof createAutoReply>>;

export const autoReplyResolvers = {
  Query: {
    autoReplies: async (
      _parent: unknown,
      args: { productId?: string | null },
      context: GraphQLContext,
    ): Promise<Awaited<ReturnType<typeof getAutoReplies>>> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await getAutoReplies(user.id, args.productId ?? undefined);
      } catch (error) {
        throwGraphQLError(error, "Unable to retrieve automatic replies.", [
          AutoReplyError,
        ]);
      }
    },
  },

  Mutation: {
    createAutoReply: async (
      _parent: unknown,
      args: { input: CreateAutoReplyInput },
      context: GraphQLContext,
    ): Promise<AutoReplyResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await createAutoReply(user.id, args.input);
      } catch (error) {
        throwGraphQLError(error, "Unable to create automatic reply.", [
          AutoReplyError,
        ]);
      }
    },
    updateAutoReply: async (
      _parent: unknown,
      args: { id: string; input: UpdateAutoReplyInput },
      context: GraphQLContext,
    ): Promise<AutoReplyResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await updateAutoReply(user.id, args.id, args.input);
      } catch (error) {
        throwGraphQLError(error, "Unable to update automatic reply.", [
          AutoReplyError,
        ]);
      }
    },

    moveAutoReply: async (
      _parent: unknown,
      args: { id: string; direction: "UP" | "DOWN" },
      context: GraphQLContext,
    ): Promise<AutoReplyResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await moveAutoReply(user.id, args.id, args.direction);
      } catch (error) {
        throwGraphQLError(error, "Unable to reorder automatic replies.", [
          AutoReplyError,
        ]);
      }
    },

    deleteAutoReply: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ): Promise<boolean> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await deleteAutoReply(user.id, args.id);
      } catch (error) {
        throwGraphQLError(error, "Unable to delete automatic reply.", [
          AutoReplyError,
        ]);
      }
    },
  },

  AutoReply: {
    createdAt: (parent: AutoReplyResult) => parent.createdAt.toISOString(),
    updatedAt: (parent: AutoReplyResult) => parent.updatedAt.toISOString(),
  },
};
