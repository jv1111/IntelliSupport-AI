import "server-only";
import { throwGraphQLError } from "@/server/graphql/shared/throw-graphql-error";

import {
  addEmail,
  deleteAccountEmail,
  EmailError,
  getAccountEmails,
  verifyEmail,
} from "@/server/services/emails";
import { requireAuthenticatedUser } from "@/server/graphql/shared/require-authenticated-user";
import type { GraphQLContext } from "@/server/graphql/context";

type AccountEmailResult = Awaited<ReturnType<typeof getAccountEmails>>[number];

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
    ): Promise<AccountEmailResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await addEmail(user.id, args);
      } catch (error) {
        throwGraphQLError(error, "Unable to send verification email.", [
          EmailError,
        ]);
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

    deleteAccountEmail: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ): Promise<boolean> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await deleteAccountEmail(user.id, args.id);
      } catch (error) {
        throwGraphQLError(error, "Unable to delete email address.", [
          EmailError,
        ]);
      }
    },
  },

  AccountEmail: {
    verifiedAt: (parent: AccountEmailResult) =>
      parent.verifiedAt?.toISOString() ?? null,
    expiresAt: (parent: AccountEmailResult) =>
      parent.expiresAt?.toISOString() ?? null,
  },
};
