import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/ratelimit";
import { mutate } from "@/lib/db";
import { randomId } from "@/lib/crypto";
import { queueMail } from "@/lib/mail";
import { site } from "@/lib/site";

export async function POST(request: Request) {
  const limit = rateLimit(request, "contact", { limit: 6, windowMs: 300000 });
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const body = await request.json().catch(() => null);
  const kind = body?.kind === "visit" ? "visit" : "contact";
  const email = String(body?.email ?? "").trim();
  const name = String(body?.name ?? "").trim();
  const locale = body?.locale === "de" ? "de" : "en";

  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email) || name.length < 2) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const message = {
    id: randomId("msg-"),
    date: new Date().toISOString(),
    kind: kind as "contact" | "visit",
    name: name.slice(0, 120),
    email: email.slice(0, 160),
    phone: String(body?.phone ?? "").slice(0, 40),
    subject: String(body?.subject ?? "").slice(0, 120),
    body: String(body?.body ?? "").slice(0, 4000),
    date_requested: String(body?.date ?? "").slice(0, 40),
    guests: Number(body?.guests) || undefined,
    locale,
  };

  await mutate((db) => {
    db.messages.push(message);
  });

  await queueMail({
    to: site.contact.email,
    subject: `[${kind}] ${message.subject || message.name}`,
    text: `${message.name} <${message.email}>\n${message.phone}\n\n${message.body}\n\n${message.date_requested} ${
      message.guests ?? ""
    }`,
  });

  return NextResponse.json({ ok: true });
}
