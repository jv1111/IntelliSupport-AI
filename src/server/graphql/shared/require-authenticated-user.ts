import "server-only";

import { GraphQLError } from "graphql";
import type { GraphQLContext } from "@/server/graphql/context";

export function requireAuthenticatedUser(context: GraphQLContext) {
  if (!context.sessionUser) {
    throw new GraphQLError("Authentication required.", {
      extensions: {
        code: "UNAUTHENTICATED",
      },
    });
  }

  return context.sessionUser;
}
