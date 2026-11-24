export const geminiTypeDefs = `#graphql
  type GeminiResponse {
    text: String!
    model: String!
  }

  input SendGeminiMessageInput {
    message: String!
  }

  extend type Mutation {
    sendGeminiMessage(input: SendGeminiMessageInput!): GeminiResponse!
  }
`;
