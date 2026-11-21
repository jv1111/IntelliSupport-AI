import "server-only";

import { throwGraphQLError } from "@/server/graphql/shared/throw-graphql-error";
import { requireAuthenticatedUser } from "@/server/graphql/shared/require-authenticated-user";
import type { GraphQLContext } from "@/server/graphql/context";
import {
  BotSettingsError,
  getBotSettings,
  updateBotSettings,
} from "@/server/services/bot-settings";

interface UpdateBotSettingsInput {
  aiEnabled?: boolean;
  autoRepliesEnabled?: boolean;
}

type BotSettingsResult = Awaited<ReturnType<typeof getBotSettings>>;

export const botSettingsResolvers = {
  Query: {
    botSettings: async (
      _parent: unknown,
      _args: Record<string, never>,
      context: GraphQLContext,
    ): Promise<BotSettingsResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await getBotSettings(user.id);
      } catch (error) {
        throwGraphQLError(error, "Unable to retrieve bot settings.", [
          BotSettingsError,
        ]);
      }
    },
  },

  Mutation: {
    updateBotSettings: async (
      _parent: unknown,
      args: { input: UpdateBotSettingsInput },
      context: GraphQLContext,
    ): Promise<BotSettingsResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await updateBotSettings(user.id, args.input);
      } catch (error) {
        throwGraphQLError(error, "Unable to update bot settings.", [
          BotSettingsError,
        ]);
      }
    },
  },
};
