import "server-only";
import { throwGraphQLError } from "@/server/graphql/shared/throw-graphql-error";

import {
  addEmail,
  EmailError,
  getAccountEmails,
  verifyEmail,
} from "@/server/services/emails";
import { requireAuthenticatedUser } from "@/server/graphql/shared/require-authenticated-user";
import type { GraphQLContext } from "@/server/graphql/context";

type AccountEmailResult = Awaited<ReturnType<typeof getAccountEmails>>[number];

type AddEmailResult = Awaited<ReturnType<typeof addEmail>>;

export const emailResolvers = {
  Query: {
    accountEmails: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ): Promise<Awaited<ReturnType<typeof getAccountEmails>>> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await getAccountEmails(user.id);
      } catch (error) {
        throwGraphQLError(error, "Unable to retrieve account emails.", [
          EmailError,
        ]);
      }
    },
  },

  Mutation: {
    addEmail: async (
      _parent: unknown,
      args: { email: string },
      context: GraphQLContext,
    ): Promise<AddEmailResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await addEmail(user.id, args);
      } catch (error) {
        throwGraphQLError(error, "Unable to add email.", [EmailError]);
      }
    },

    verifyEmail: async (
      _parent: unknown,
      args: { email: string; code: string },
      context: GraphQLContext,
    ): Promise<AccountEmailResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await verifyEmail(user.id, args);
      } catch (error) {
        throwGraphQLError(error, "Unable to verify email.", [EmailError]);
      }
    },
  },

  AccountEmail: {
    verifiedAt: (parent: AccountEmailResult) =>
      parent.verifiedAt?.toISOString() ?? null,
    expiresAt: (parent: AccountEmailResult) =>
      parent.expiresAt?.toISOString() ?? null,
  },

  AddEmailResult: {
    verifiedAt: () => null,
    expiresAt: (parent: AddEmailResult) =>
      parent.expiresAt?.toISOString() ?? null,
  },
};
