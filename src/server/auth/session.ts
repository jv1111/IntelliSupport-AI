import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/server/db/prisma";

export const SESSION_COOKIE_NAME = "intellisupport_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
    select: {
      id: true,
    },
  });

  return {
    token,
    expiresAt,
  };
}

export async function revokeSession(token: string | null): Promise<void> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return;
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  await prisma.session.deleteMany({
    where: { tokenHash },
  });
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  createdAt: Date;
}

export async function getSessionUser(
  token: string | null,
): Promise<AuthenticatedUser | null> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          username: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return session.user;
}
