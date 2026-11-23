import "server-only";

import { throwGraphQLError } from "@/server/graphql/shared/throw-graphql-error";
import {
  addPhone,
  deleteAccountPhone,
  getAccountPhones,
  PhoneError,
  verifyPhone,
} from "@/server/services/phones";
import { requireAuthenticatedUser } from "@/server/graphql/shared/require-authenticated-user";
import type { GraphQLContext } from "@/server/graphql/context";

type AccountPhoneResult = Awaited<ReturnType<typeof getAccountPhones>>[number];

export const phoneResolvers = {
  Query: {
    accountPhones: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ): Promise<Awaited<ReturnType<typeof getAccountPhones>>> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await getAccountPhones(user.id);
      } catch (error) {
        throwGraphQLError(error, "Unable to retrieve account phone numbers.", [
          PhoneError,
        ]);
      }
    },
  },

  Mutation: {
    addPhone: async (
      _parent: unknown,
      args: { phone: string },
      context: GraphQLContext,
    ): Promise<AccountPhoneResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await addPhone(user.id, args);
      } catch (error) {
        throwGraphQLError(error, "Unable to send verification SMS.", [
          PhoneError,
        ]);
      }
    },

    verifyPhone: async (
      _parent: unknown,
      args: { phone: string; code: string },
      context: GraphQLContext,
    ): Promise<AccountPhoneResult> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await verifyPhone(user.id, args);
      } catch (error) {
        throwGraphQLError(error, "Unable to verify phone number.", [
          PhoneError,
        ]);
      }
    },

    deleteAccountPhone: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ): Promise<boolean> => {
      const user = requireAuthenticatedUser(context);

      try {
        return await deleteAccountPhone(user.id, args.id);
      } catch (error) {
        throwGraphQLError(error, "Unable to delete phone number.", [
          PhoneError,
        ]);
      }
    },
  },

  AccountPhone: {
    verifiedAt: (parent: AccountPhoneResult) =>
      parent.verifiedAt?.toISOString() ?? null,
    expiresAt: (parent: AccountPhoneResult) =>
      parent.expiresAt?.toISOString() ?? null,
  },
};
