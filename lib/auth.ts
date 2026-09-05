import "server-only";
import { cookies } from "next/headers";
import { getDb, mutate } from "./db";
import { randomId, signToken, verifyToken, verifyPassword } from "./crypto";
import type { Owner, Role } from "./model";

export const SESSION_COOKIE = "walko_session";
const SESSION_DAYS = 30;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function createSession(ownerId: string): Promise<string> {
  const token = signToken(`${ownerId}:${randomId()}`);
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 864e5);
  await mutate((db) => {
    db.sessions.push({ token, ownerId, created: now.toISOString(), expires: expires.toISOString() });
    const owner = db.owners.find((o) => o.id === ownerId);
    if (owner) owner.lastLogin = now.toISOString();
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await mutate((db) => {
    db.sessions = db.sessions.filter((s) => s.token !== token);
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || !verifyToken(token)) return null;
  const db = await getDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session || session.expires < new Date().toISOString()) return null;
  const owner = db.owners.find((o) => o.id === session.ownerId);
  if (!owner) return null;
  return { id: owner.id, name: owner.name, email: owner.email, role: owner.role };
}

export async function requireRole(roles: Role[]): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}

export async function authenticate(email: string, password: string): Promise<Owner | null> {
  const db = await getDb();
  const owner = db.owners.find((o) => o.email.toLowerCase() === email.trim().toLowerCase());
  if (!owner) return null;
  const ok = await verifyPassword(password, owner.passwordHash);
  return ok ? owner : null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}
