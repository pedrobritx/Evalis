import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/crypto";

const SESSION_COOKIE = "evalis_session";
const MAGIC_LINK_TTL_MINUTES = 15;
const SESSION_TTL_DAYS = 14;

export async function createMagicLink(email: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken(24);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);

  await prisma.magicLinkToken.create({
    data: { email, tokenHash, expiresAt },
  });

  return { token, expiresAt };
}

export async function consumeMagicLink(token: string) {
  const tokenHash = hashToken(token);
  const found = await prisma.magicLinkToken.findUnique({ where: { tokenHash } });

  if (!found || found.consumedAt || found.expiresAt < new Date()) {
    return null;
  }

  await prisma.magicLinkToken.update({
    where: { id: found.id },
    data: { consumedAt: new Date() },
  });

  let user = await prisma.user.findUnique({ where: { email: found.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: found.email,
        role: Role.STUDENT,
      },
    });
  }

  const rawSessionToken = generateToken(32);
  await prisma.authSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawSessionToken),
      expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawSessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    path: "/",
  });

  return user;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (!rawToken) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.authSession.delete({ where: { id: session.id } });
    }

    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session.user;
}

export async function requireRole(roles: Role[]) {
  const user = await getSessionUser();

  if (!user || !roles.includes(user.role)) {
    return null;
  }

  return user;
}
