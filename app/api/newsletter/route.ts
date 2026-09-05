import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/ratelimit";
import { mutate } from "@/lib/db";
import { randomId } from "@/lib/crypto";
import { queueMail } from "@/lib/mail";

export async function POST(request: Request) {
  const limit = rateLimit(request, "newsletter", { limit: 6, windowMs: 300000 });
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email.includes("@") || email.length > 160) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const locale = body?.locale === "de" ? "de" : "en";

  await mutate((db) => {
    db.messages.push({
      id: randomId("msg-"),
      date: new Date().toISOString(),
      kind: "newsletter",
      email,
      locale,
    });
  });

  await queueMail({
    to: email,
    subject: locale === "de" ? "Willkommen im Walko-Newsletter" : "Welcome to the Walko newsletter",
    text:
      locale === "de"
        ? "Danke für Ihr Interesse. Sie erhalten vier Briefe im Jahr: Blüte, Fruchtansatz, Ernte und Winterbericht."
        : "Thank you. You will receive four letters a year: blossom, fruit set, harvest and the winter report.",
  });

  return NextResponse.json({ ok: true });
}
