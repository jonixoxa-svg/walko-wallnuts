import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/ratelimit";
import { cookies } from "next/headers";
import { authenticate, createSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const limit = rateLimit(request, "login", { limit: 10, windowMs: 300000 });
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  const password = String(body?.password ?? "");
  if (!email || !password) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const owner = await authenticate(email, password);
  if (!owner) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

  const token = await createSession(owner.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());

  return NextResponse.json({ ok: true, role: owner.role, name: owner.name });
}
