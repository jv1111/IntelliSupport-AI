import { graphqlRequest } from "@/lib/graphql/client";

export interface BotSettings {
  aiEnabled: boolean;
  autoRepliesEnabled: boolean;
}

export interface UpdateBotSettingsInput {
  aiEnabled?: boolean;
  autoRepliesEnabled?: boolean;
}

export async function fetchBotSettings(): Promise<BotSettings> {
  const data = await graphqlRequest<{
    botSettings: BotSettings;
  }>(
    `
      query BotSettings {
        botSettings {
          aiEnabled
          autoRepliesEnabled
        }
      }
    `,
  );

  return data.botSettings;
}

export async function updateBotSettings(
  input: UpdateBotSettingsInput,
): Promise<BotSettings> {
  const data = await graphqlRequest<
    { updateBotSettings: BotSettings },
    { input: UpdateBotSettingsInput }
  >(
    `
      mutation UpdateBotSettings($input: UpdateBotSettingsInput!) {
        updateBotSettings(input: $input) {
          aiEnabled
          autoRepliesEnabled
        }
      }
    `,
    { input },
  );

  return data.updateBotSettings;
}
