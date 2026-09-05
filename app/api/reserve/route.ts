import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/ratelimit";
import { mutate } from "@/lib/db";

const HOLD_MINUTES = 30;

/** Holds the selected trees while the buyer completes checkout. */
export async function POST(request: Request) {
  const limit = rateLimit(request, "reserve", { limit: 40, windowMs: 600000 });
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const body = await request.json().catch(() => null);
  const codes = Array.from(new Set((body?.items ?? []).map((c: unknown) => String(c).toUpperCase()))).slice(0, 50);
  if (!codes.length) return NextResponse.json({ error: "empty_selection" }, { status: 400 });

  const until = new Date(Date.now() + HOLD_MINUTES * 60000).toISOString();
  const result = await mutate((db) => {
    const taken: string[] = [];
    const held: string[] = [];
    for (const code of codes) {
      const tree = db.trees.find((t) => t.code === code);
      if (!tree || tree.status === "sold") {
        taken.push(String(code));
        continue;
      }
      tree.status = "reserved";
      tree.reservedUntil = until;
      held.push(tree.code);
    }
    return { taken, held };
  });

  return NextResponse.json({ ok: result.taken.length === 0, ...result, until });
}

/** Releases a hold when the buyer leaves checkout without paying. */
export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const codes = (body?.items ?? []).map((c: unknown) => String(c).toUpperCase());
  await mutate((db) => {
    for (const code of codes) {
      const tree = db.trees.find((t) => t.code === code);
      if (tree && tree.status === "reserved") {
        tree.status = "available";
        delete tree.reservedUntil;
      }
    }
  });
  return NextResponse.json({ ok: true });
}
