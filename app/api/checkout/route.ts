import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/ratelimit";
import { cookies } from "next/headers";
import { getDb, mutate } from "@/lib/db";
import { hashPassword, randomId, tempPassword } from "@/lib/crypto";
import { createSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { orderConfirmationMail, queueMail } from "@/lib/mail";
import { baseUrl, site } from "@/lib/site";
import type { Order } from "@/lib/model";

interface Payload {
  items?: string[];
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  zip?: string;
  city?: string;
  country?: string;
  method?: Order["method"];
  gift?: { name?: string; message?: string } | null;
  locale?: "en" | "de";
  createAccount?: boolean;
  marketing?: boolean;
}

const METHODS: Order["method"][] = ["card", "paypal", "applepay", "googlepay", "transfer"];

export async function POST(request: Request) {
  const limit = rateLimit(request, "checkout", { limit: 12, windowMs: 600000 });
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const body = (await request.json().catch(() => null)) as Payload | null;
  const locale = body?.locale === "de" ? "de" : "en";
  const codes = Array.from(new Set((body?.items ?? []).map((c) => String(c).toUpperCase()))).slice(0, 50);
  const name = (body?.name ?? "").trim();
  const email = (body?.email ?? "").trim().toLowerCase();
  const method = METHODS.includes(body?.method as Order["method"]) ? (body!.method as Order["method"]) : "card";

  if (!codes.length) return NextResponse.json({ error: "empty_selection" }, { status: 400 });
  if (name.length < 2) return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return NextResponse.json({ error: "invalid_email" }, { status: 400 });

  const db = await getDb();
  const unavailable = codes.filter((code) => {
    const tree = db.trees.find((t) => t.code === code);
    return !tree || tree.status === "sold";
  });
  if (unavailable.length) {
    return NextResponse.json({ error: "unavailable", codes: unavailable }, { status: 409 });
  }

  const demoMode = !process.env.STRIPE_SECRET_KEY;
  // With a Stripe secret key present this is where a PaymentIntent would be
  // created and confirmed before the order is written. Without keys we never
  // ask for card data at all and record the order as a demo purchase.

  const existingOwner = db.owners.find((o) => o.email.toLowerCase() === email);
  let password: string | undefined;
  let ownerId: string;

  if (existingOwner) {
    ownerId = existingOwner.id;
  } else {
    ownerId = randomId("own-");
    password = tempPassword();
    const passwordHash = await hashPassword(password);
    await mutate((database) => {
      database.owners.push({
        id: ownerId,
        name,
        email,
        passwordHash,
        role: "owner",
        country: (body?.country ?? "").slice(0, 40) || "—",
        city: body?.city?.slice(0, 60),
        since: new Date().toISOString().slice(0, 10),
        newsletter: Boolean(body?.marketing),
      });
    });
  }

  const orderId = `WW-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${randomId().replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase()}`;
  const total = codes.length * site.totals.pricePerTree;

  const order = await mutate((database) => {
    const now = new Date().toISOString();
    for (const code of codes) {
      const tree = database.trees.find((t) => t.code === code);
      if (!tree) continue;
      tree.status = "sold";
      tree.ownerId = ownerId;
      tree.soldAt = now.slice(0, 10);
      delete tree.reservedUntil;
    }
    const created: Order = {
      id: orderId,
      date: now,
      ownerId,
      name,
      email,
      phone: body?.phone?.slice(0, 40),
      address: body?.address?.slice(0, 120),
      zip: body?.zip?.slice(0, 20),
      city: body?.city?.slice(0, 60),
      country: body?.country?.slice(0, 40),
      items: codes.map((code) => ({ code, price: site.totals.pricePerTree })),
      total,
      method,
      status: "paid",
      gift: body?.gift?.name ? { name: body.gift.name.slice(0, 80), message: body.gift.message?.slice(0, 240) } : undefined,
      demo: demoMode,
      locale,
    };
    database.orders.unshift(created);
    return created;
  });

  const mail = orderConfirmationMail({
    locale,
    name,
    orderId,
    codes,
    total,
    password,
    baseUrl: baseUrl(),
  });
  await queueMail({ ...mail, to: email });

  // Sign the buyer straight into their owner account.
  const token = await createSession(ownerId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    password,
    demo: demoMode,
    codes,
    total,
  });
}
