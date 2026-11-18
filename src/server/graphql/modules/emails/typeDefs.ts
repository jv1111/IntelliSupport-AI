export const emailTypeDefs = `#graphql
  enum AccountEmailStatus {
    VERIFIED
    UNVERIFIED
  }

  type AccountEmail {
    id: ID!
    email: String!
    status: AccountEmailStatus!
    verifiedAt: String
    expiresAt: String
  }

  extend type Query {
    accountEmails: [AccountEmail!]!
  }

  extend type Mutation {
    addEmail(email: String!): AccountEmail!
    verifyEmail(email: String!, code: String!): AccountEmail!
  }
`;
