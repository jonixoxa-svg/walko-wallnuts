import { NextResponse } from "next/server";
import { getDb, mutate } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { randomId } from "@/lib/crypto";
import { queueMail } from "@/lib/mail";

export async function POST(request: Request) {
  const user = await requireRole(["admin"]);
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const titleEn = String(body?.titleEn ?? "").slice(0, 160);
  const titleDe = String(body?.titleDe ?? "").slice(0, 160);
  const bodyEn = String(body?.bodyEn ?? "").slice(0, 4000);
  const bodyDe = String(body?.bodyDe ?? "").slice(0, 4000);
  if (!titleEn || !titleDe) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const announcement = {
    id: randomId("ann-"),
    date: new Date().toISOString().slice(0, 10),
    en: { title: titleEn, body: bodyEn },
    de: { title: titleDe, body: bodyDe },
  };

  await mutate((db) => {
    db.announcements.unshift(announcement);
  });

  if (body?.notify) {
    const db = await getDb();
    const recipients = db.owners.filter((o) => o.role === "owner" && o.newsletter !== false).slice(0, 200);
    for (const owner of recipients) {
      const german = owner.country === "AT" || owner.country === "DE" || owner.country === "CH";
      await queueMail({
        to: owner.email,
        subject: german ? titleDe : titleEn,
        text: german ? bodyDe : bodyEn,
      });
    }
  }

  return NextResponse.json({ ok: true, announcement });
}
