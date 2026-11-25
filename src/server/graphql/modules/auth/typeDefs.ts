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

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
    confirmPassword: String!
  }

  input ResetPasswordInput {
    newPassword: String!
    confirmPassword: String!
  }

  type ForgotPasswordVerification {
    method: String!
    destination: String!
  }

  type ForgotPasswordCodeVerification {
    resetToken: String!
  }

  extend type Query {
    me: User
  }

  type Mutation {
    sendForgotPasswordVerification(identifier: String!): ForgotPasswordVerification!
    verifyForgotPasswordCode(destination: String!, code: String!): ForgotPasswordCodeVerification!
    resetPassword(resetToken: String!, input: ResetPasswordInput!): Boolean!
    register(input: RegisterInput!): User!
    login(input: LoginInput!): User!
    changePassword(input: ChangePasswordInput!): Boolean!
    logout: Boolean!
  }
`;
