import "server-only";

import { authResolvers, authTypeDefs } from "@/server/graphql/modules/auth";
import { emailResolvers, emailTypeDefs } from "@/server/graphql/modules/emails";
import {
  productResolvers,
  productTypeDefs,
} from "@/server/graphql/modules/products";
import {
  knowledgeBaseResolvers,
  knowledgeBaseTypeDefs,
} from "@/server/graphql/modules/knowledge-base";

const rootTypeDefs = `#graphql
  type Query {
    health: String!
  }
`;

export const typeDefs = [
  rootTypeDefs,
  authTypeDefs,
  emailTypeDefs,
  productTypeDefs,
  knowledgeBaseTypeDefs,
];

export const resolvers = {
  Query: {
    health: () => "ok",
    ...authResolvers.Query,
    ...emailResolvers.Query,
    ...productResolvers.Query,
    ...knowledgeBaseResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...emailResolvers.Mutation,
    ...productResolvers.Mutation,
    ...knowledgeBaseResolvers.Mutation,
  },

  User: authResolvers.User,
  AccountEmail: emailResolvers.AccountEmail,
  AddEmailResult: emailResolvers.AddEmailResult,
  Product: productResolvers.Product,
  KnowledgeBaseArticle: knowledgeBaseResolvers.KnowledgeBaseArticle,
};
