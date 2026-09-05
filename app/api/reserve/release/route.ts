import { NextResponse } from "next/server";
import { mutate } from "@/lib/db";

/** Beacon target: releases holds when a buyer leaves checkout. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const codes = (body?.items ?? []).map((c: unknown) => String(c).toUpperCase());
  if (!codes.length) return NextResponse.json({ ok: true });

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
