import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import {
  getSessionUser,
  SESSION_COOKIE_NAME,
  type AuthenticatedUser,
} from "@/server/auth/session";

export const getCurrentUser = cache(
  async (): Promise<AuthenticatedUser | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;

    return getSessionUser(token);
  },
);
