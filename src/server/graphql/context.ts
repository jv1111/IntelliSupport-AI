import "server-only";

import type { NextRequest } from "next/server";
import {
  getSessionUser,
  SESSION_COOKIE_NAME,
  type AuthenticatedUser,
} from "@/server/auth/session";

export { SESSION_COOKIE_NAME };

export type SessionCookieChange =
  | {
      type: "set";
      token: string;
      expiresAt: Date;
    }
  | {
      type: "clear";
    };

export interface GraphQLContext {
  sessionUser: AuthenticatedUser | null;
  sessionToken: string | null;
  sessionCookieChange: SessionCookieChange | null;
}

export async function createGraphQLContext(
  request: NextRequest,
): Promise<GraphQLContext> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;

  return {
    sessionUser: await getSessionUser(token),
    sessionToken: token,
    sessionCookieChange: null,
  };
}
