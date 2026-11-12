import { ApolloServer, type ApolloServerPlugin } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import type { NextRequest } from "next/server";
import {
  createGraphQLContext,
  SESSION_COOKIE_NAME,
  type GraphQLContext,
} from "@/server/graphql/context";
import { resolvers, typeDefs } from "@/server/graphql/schema";

const sessionCookiePlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    return {
      async willSendResponse({ contextValue, response }) {
        const change = contextValue.sessionCookieChange;

        if (!change) {
          return;
        }

        const cookieParts = [
          `${SESSION_COOKIE_NAME}=${change.type === "set" ? change.token : ""}`,
          "Path=/",
          "HttpOnly",
          "SameSite=Lax",
        ];

        if (change.type === "set") {
          cookieParts.push(
            `Expires=${change.expiresAt.toUTCString()}`,
            `Max-Age=${Math.max(
              0,
              Math.floor((change.expiresAt.getTime() - Date.now()) / 1000),
            )}`,
          );
        } else {
          cookieParts.push(
            "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
            "Max-Age=0",
          );
        }

        if (process.env.NODE_ENV === "production") {
          cookieParts.push("Secure");
        }

        response.http?.headers.set("set-cookie", cookieParts.join("; "));
      },
    };
  },
};

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  plugins: [sessionCookiePlugin],
});

const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(
  server,
  {
    context: async (request) => createGraphQLContext(request),
  },
);

export async function GET(request: NextRequest): Promise<Response> {
  return handler(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  return handler(request);
}
