export const autoReplyTypeDefs = `#graphql
  type AutoReply {
    id: ID!
    productId: ID!
    parentId: ID
    question: String!
    answer: String!
    position: Int!
    createdAt: String!
    updatedAt: String!
  }

  input CreateAutoReplyInput {
    productId: ID!
    parentId: ID
    question: String!
    answer: String!
  }

  input UpdateAutoReplyInput {
    question: String!
    answer: String!
  }

  extend type Query {
    autoReplies(productId: ID): [AutoReply!]!
  }

  enum AutoReplyMoveDirection {
    UP
    DOWN
  }

  extend type Mutation {
    createAutoReply(input: CreateAutoReplyInput!): AutoReply!
    updateAutoReply(id: ID!, input: UpdateAutoReplyInput!): AutoReply!
    moveAutoReply(id: ID!, direction: AutoReplyMoveDirection!): AutoReply!
    deleteAutoReply(id: ID!): Boolean!
  }
`;
