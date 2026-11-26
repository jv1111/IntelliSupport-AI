import "server-only";

import { throwGraphQLError } from "@/server/graphql/shared/throw-graphql-error";
import { requireAuthenticatedUser } from "@/server/graphql/shared/require-authenticated-user";
import type { GraphQLContext } from "@/server/graphql/context";
import { GeminiError, sendGeminiMessage } from "@/server/services/gemini";
import { AutoReplyError } from "@/server/services/auto-replies";
import { ProductError } from "@/server/services/products";
import { getPlaygroundChatSystemPrompt } from "@/server/loaders/playground-chat";

interface SendGeminiMessageInput {
  message: string;
  productId: string;
}

type GeminiResponseResult = Awaited<ReturnType<typeof sendGeminiMessage>>;

export const geminiResolvers = {
  Mutation: {
    sendGeminiMessage: async (
      _parent: unknown,
      args: { input: SendGeminiMessageInput },
      context: GraphQLContext,
    ): Promise<GeminiResponseResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        const systemInstruction = await getPlaygroundChatSystemPrompt(
          user.id,
          args.input.productId,
        );

        return await sendGeminiMessage({
          message: args.input.message,
          systemInstruction,
        });
      } catch (error) {
        throwGraphQLError(error, "Unable to send message to Gemini.", [
          GeminiError,
          ProductError,
          AutoReplyError,
        ]);
      }
    },
  },
};
