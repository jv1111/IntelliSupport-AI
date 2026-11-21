export const botSettingsTypeDefs = `#graphql
  type BotSettings {
    aiEnabled: Boolean!
    autoRepliesEnabled: Boolean!
  }

  input UpdateBotSettingsInput {
    aiEnabled: Boolean
    autoRepliesEnabled: Boolean
  }

  extend type Query {
    botSettings: BotSettings!
  }

  extend type Mutation {
    updateBotSettings(input: UpdateBotSettingsInput!): BotSettings!
  }
`;
