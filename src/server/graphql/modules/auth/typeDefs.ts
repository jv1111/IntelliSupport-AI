export const authTypeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    createdAt: String!
  }

  input RegisterInput {
    username: String!
    password: String!
  }

  input LoginInput {
    username: String!
    password: String!
  }

  extend type Query {
    me: User
  }

  type Mutation {
    register(input: RegisterInput!): User!
    login(input: LoginInput!): User!
    logout: Boolean!
  }
`;
