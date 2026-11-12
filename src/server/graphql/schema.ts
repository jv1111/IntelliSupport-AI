import "server-only";

import { GraphQLError } from "graphql";
import {
  RegistrationError,
  registerUser,
} from "@/server/services/register-user";
import { LoginError, loginUser } from "@/server/services/login-user";
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

type UserResult = Awaited<ReturnType<typeof registerUser>>;
type LoginResult = Awaited<ReturnType<typeof loginUser>>;
type PublicUser = UserResult | LoginResult;

export const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    createdAt: String!
  }

  input RegisterInput {
    username: String!
    password: String!
  }

  input LoginInput {
    username: String!
    password: String!
  }

  type Query {
    health: String!
    me: User
  }

  type Mutation {
    register(input: RegisterInput!): User!
    login(input: LoginInput!): User!
    logout: Boolean!
  }
`;

export const resolvers = {
  Query: {
    health: () => "ok",
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
