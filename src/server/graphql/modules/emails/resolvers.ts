import "server-only";

import { GraphQLError } from "graphql";
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

function throwEmailGraphQLError(
  error: unknown,
  fallbackMessage: string,
): never {
  if (error instanceof EmailError) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: error.code,
      },
    });
  }

  throw new GraphQLError(fallbackMessage, {
    extensions: {
      code: "INTERNAL_SERVER_ERROR",
    },
  });
}

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
        throwEmailGraphQLError(error, "Unable to retrieve account emails.");
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
        throwEmailGraphQLError(error, "Unable to add email.");
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
        throwEmailGraphQLError(error, "Unable to verify email.");
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
