import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { queueMail } from "@/lib/mail";

export async function POST(request: Request) {
  const user = await requireRole(["admin"]);
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const subject = String(body?.subject ?? "").slice(0, 160);
  const text = String(body?.body ?? "").slice(0, 8000);
  if (!subject || !text) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const db = await getDb();
  const recipients = db.owners.filter((o) => o.role === "owner");
  for (const owner of recipients.slice(0, 500)) {
    await queueMail({ to: owner.email, subject, text: `${owner.name},\n\n${text}` });
  }

  return NextResponse.json({ ok: true, count: recipients.length });
}
