export const phoneTypeDefs = `#graphql
  enum AccountPhoneStatus {
    VERIFIED
    UNVERIFIED
  }

  type AccountPhone {
    id: ID!
    phone: String!
    status: AccountPhoneStatus!
    verifiedAt: String
    expiresAt: String
  }

  extend type Query {
    accountPhones: [AccountPhone!]!
  }

  extend type Mutation {
    addPhone(phone: String!): AccountPhone!
    verifyPhone(phone: String!, code: String!): AccountPhone!
    deleteAccountPhone(id: ID!): Boolean!
  }
`;
