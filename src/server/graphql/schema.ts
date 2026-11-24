import "server-only";

import { authResolvers, authTypeDefs } from "@/server/graphql/modules/auth";
import { emailResolvers, emailTypeDefs } from "@/server/graphql/modules/emails";
import { phoneResolvers, phoneTypeDefs } from "@/server/graphql/modules/phones";
import {
  productResolvers,
  productTypeDefs,
} from "@/server/graphql/modules/products";
import {
  knowledgeBaseResolvers,
  knowledgeBaseTypeDefs,
} from "@/server/graphql/modules/knowledge-base";
import {
  autoReplyResolvers,
  autoReplyTypeDefs,
} from "@/server/graphql/modules/auto-replies";
import {
  botSettingsResolvers,
  botSettingsTypeDefs,
} from "@/server/graphql/modules/bot-settings";
import {
  geminiResolvers,
  geminiTypeDefs,
} from "@/server/graphql/modules/gemini";

const rootTypeDefs = `#graphql
  type Query {
    health: String!
  }
`;

export const typeDefs = [
  rootTypeDefs,
  authTypeDefs,
  emailTypeDefs,
  phoneTypeDefs,
  productTypeDefs,
  knowledgeBaseTypeDefs,
  autoReplyTypeDefs,
  botSettingsTypeDefs,
  geminiTypeDefs,
];

export const resolvers = {
  Query: {
    health: () => "ok",
    ...authResolvers.Query,
    ...emailResolvers.Query,
    ...phoneResolvers.Query,
    ...productResolvers.Query,
    ...knowledgeBaseResolvers.Query,
    ...autoReplyResolvers.Query,
    ...botSettingsResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...emailResolvers.Mutation,
    ...phoneResolvers.Mutation,
    ...productResolvers.Mutation,
    ...knowledgeBaseResolvers.Mutation,
    ...autoReplyResolvers.Mutation,
    ...botSettingsResolvers.Mutation,
    ...geminiResolvers.Mutation,
  },

  User: authResolvers.User,
  AccountEmail: emailResolvers.AccountEmail,
  AccountPhone: phoneResolvers.AccountPhone,
  Product: productResolvers.Product,
  KnowledgeBaseArticle: knowledgeBaseResolvers.KnowledgeBaseArticle,
  AutoReply: autoReplyResolvers.AutoReply,
};
