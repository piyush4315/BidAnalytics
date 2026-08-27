import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { prisma } from "./prisma";

const COOKIE = "bidledger_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setSubject(user.id)
    .sign(secret);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  cookies().delete(COOKIE);
}

export async function readSessionToken(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: String(payload.sub || payload.id),
      name: String(payload.name || ""),
      email: String(payload.email || ""),
      role: String(payload.role || "VIEWER"),
    };
  } catch {
    return null;
  }
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(COOKIE)?.value;
  const session = await readSessionToken(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

export function getSessionCookieName() {
  return COOKIE;
}
