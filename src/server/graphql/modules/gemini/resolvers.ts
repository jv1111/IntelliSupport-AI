import "server-only";

import { throwGraphQLError } from "@/server/graphql/shared/throw-graphql-error";
import { requireAuthenticatedUser } from "@/server/graphql/shared/require-authenticated-user";
import type { GraphQLContext } from "@/server/graphql/context";
import { GeminiError, sendGeminiMessage } from "@/server/services/gemini";

interface SendGeminiMessageInput {
  message: string;
}

type GeminiResponseResult = Awaited<ReturnType<typeof sendGeminiMessage>>;

export const geminiResolvers = {
  Mutation: {
    sendGeminiMessage: async (
      _parent: unknown,
      args: { input: SendGeminiMessageInput },
      context: GraphQLContext,
    ): Promise<GeminiResponseResult> => {
      requireAuthenticatedUser(context);

      try {
        return await sendGeminiMessage(args.input);
      } catch (error) {
        throwGraphQLError(error, "Unable to send message to Gemini.", [
          GeminiError,
        ]);
      }
    },
  },
};
