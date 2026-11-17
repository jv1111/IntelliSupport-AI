import "server-only";

import { GraphQLError } from "graphql";
import {
  RegistrationError,
  registerUser,
} from "@/server/services/register-user";
import { LoginError, loginUser } from "@/server/services/login-user";
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

export const authResolvers = {
  Query: {
    me: (_parent: unknown, _args: unknown, context: GraphQLContext) =>
      context.sessionUser,
  },

  Mutation: {
    register: async (
      _parent: unknown,
      args: { input: RegisterInput },
    ): Promise<UserResult> => {
      try {
        return await registerUser(args.input);
      } catch (error) {
        if (error instanceof RegistrationError) {
          throw new GraphQLError(error.message, {
            extensions: {
              code: error.code,
            },
          });
        }

        throw new GraphQLError("Unable to register account.", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
          },
        });
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
        if (error instanceof LoginError) {
          throw new GraphQLError(error.message, {
            extensions: {
              code: error.code,
            },
          });
        }

        throw new GraphQLError("Unable to log in.", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
          },
        });
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
        if (error instanceof ChangePasswordError) {
          throw new GraphQLError(error.message, {
            extensions: {
              code: error.code,
            },
          });
        }

        throw new GraphQLError("Unable to change password.", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
          },
        });
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
      } catch {
        throw new GraphQLError("Unable to log out.", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
          },
        });
      }
    },
  },

  User: {
    createdAt: (parent: PublicUser) => parent.createdAt.toISOString(),
  },
};
