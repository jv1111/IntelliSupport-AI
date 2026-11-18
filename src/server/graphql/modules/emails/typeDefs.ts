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

  type AddEmailResult {
    id: ID!
    email: String!
    status: AccountEmailStatus!
    verifiedAt: String
    expiresAt: String
    verificationCode: String
  }

  extend type Query {
    accountEmails: [AccountEmail!]!
  }

  extend type Mutation {
    addEmail(email: String!): AddEmailResult!
    verifyEmail(email: String!, code: String!): AccountEmail!
  }
`;
