import "server-only";

import { authResolvers, authTypeDefs } from "@/server/graphql/modules/auth";
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
  productTypeDefs,
  knowledgeBaseTypeDefs,
];

export const resolvers = {
  Query: {
    health: () => "ok",
    ...authResolvers.Query,
    ...productResolvers.Query,
    ...knowledgeBaseResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...productResolvers.Mutation,
    ...knowledgeBaseResolvers.Mutation,
  },

  User: authResolvers.User,
  Product: productResolvers.Product,
  KnowledgeBaseArticle: knowledgeBaseResolvers.KnowledgeBaseArticle,
};
