import "server-only";

import { authResolvers, authTypeDefs } from "@/server/graphql/modules/auth";
import {
  productResolvers,
  productTypeDefs,
} from "@/server/graphql/modules/products";

const rootTypeDefs = `#graphql
  type Query {
    health: String!
  }
`;

export const typeDefs = [rootTypeDefs, authTypeDefs, productTypeDefs];

export const resolvers = {
  Query: {
    health: () => "ok",
    ...authResolvers.Query,
    ...productResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...productResolvers.Mutation,
  },

  User: authResolvers.User,
  Product: productResolvers.Product,
};
