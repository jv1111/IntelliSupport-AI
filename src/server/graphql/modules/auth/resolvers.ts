import "server-only";
import { throwGraphQLError } from "@/server/graphql/shared/throw-graphql-error";

import {
  RegistrationError,
  registerUser,
} from "@/server/services/register-user";
import { LoginError, loginUser } from "@/server/services/login-user";
import {
  ForgotPasswordError,
  sendForgotPasswordVerification,
} from "@/server/services/forgot-password";
import {
  ChangePasswordError,
  changePassword as changeUserPassword,
} from "@/server/services/change-password";
import { requireAuthenticatedUser } from "@/server/graphql/shared/require-authenticated-user";
import { createSession, revokeSession } from "@/server/auth/session";
import type { GraphQLContext } from "@/server/graphql/context";

interface RegisterInput {
  username: string;
  password: string;
}

interface LoginInput {
  username: string;
  password: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type UserResult = Awaited<ReturnType<typeof registerUser>>;
type LoginResult = Awaited<ReturnType<typeof loginUser>>;
type PublicUser = UserResult | LoginResult;
type ForgotPasswordVerificationResult = Awaited<
  ReturnType<typeof sendForgotPasswordVerification>
>;

export const authResolvers = {
  Query: {
    me: (_parent: unknown, _args: unknown, context: GraphQLContext) =>
      context.sessionUser,
  },

  Mutation: {
    sendForgotPasswordVerification: async (
      _parent: unknown,
      args: { identifier: string },
    ): Promise<ForgotPasswordVerificationResult> => {
      try {
        return await sendForgotPasswordVerification(args.identifier);
      } catch (error) {
        throwGraphQLError(error, "Unable to send verification code.", [
          ForgotPasswordError,
        ]);
      }
    },

    register: async (
      _parent: unknown,
      args: { input: RegisterInput },
    ): Promise<UserResult> => {
      try {
        return await registerUser(args.input);
      } catch (error) {
        throwGraphQLError(error, "Unable to register account.", [
          RegistrationError,
        ]);
      }
    },

    login: async (
      _parent: unknown,
      args: { input: LoginInput },
      context: GraphQLContext,
    ): Promise<LoginResult> => {
      try {
        const user = await loginUser(args.input);
        const session = await createSession(user.id);

        context.sessionCookieChange = {
          type: "set",
          token: session.token,
          expiresAt: session.expiresAt,
        };

        return user;
      } catch (error) {
        throwGraphQLError(error, "Unable to log in.", [LoginError]);
      }
    },

    changePassword: async (
      _parent: unknown,
      args: { input: ChangePasswordInput },
      context: GraphQLContext,
    ): Promise<boolean> => {
      const user = requireAuthenticatedUser(context);

      try {
        await changeUserPassword(user.id, args.input);

        context.sessionCookieChange = {
          type: "clear",
        };

        return true;
      } catch (error) {
        throwGraphQLError(error, "Unable to change password.", [
          ChangePasswordError,
        ]);
      }
    },

    logout: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ): Promise<boolean> => {
      try {
        await revokeSession(context.sessionToken);

        context.sessionCookieChange = {
          type: "clear",
        };

        return true;
      } catch (error) {
        throwGraphQLError(error, "Unable to log out.");
      }
    },
  },

  User: {
    createdAt: (parent: PublicUser) => parent.createdAt.toISOString(),
  },
};
