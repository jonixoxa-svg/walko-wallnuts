import { NextResponse } from "next/server";
import { mutate } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { randomId } from "@/lib/crypto";
import type { Health, Phase, TreeStatus } from "@/lib/model";

const HEALTHS: Health[] = ["excellent", "good", "fair", "attention"];
const PHASES: Phase[] = ["dormant", "blooming", "growing", "ripening", "harvested"];
const STATUSES: TreeStatus[] = ["available", "reserved", "sold"];

export async function PATCH(request: Request) {
  const user = await requireRole(["admin"]);
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const code = String(body?.code ?? "").toUpperCase();

  const result = await mutate((db) => {
    const tree = db.trees.find((t) => t.code === code);
    if (!tree) return null;

    if (STATUSES.includes(body?.status)) {
      tree.status = body.status;
      if (tree.status === "available") {
        delete tree.ownerId;
        delete tree.soldAt;
        delete tree.reservedUntil;
      }
    }
    if (HEALTHS.includes(body?.health)) tree.health = body.health;
    if (PHASES.includes(body?.phase)) tree.phase = body.phase;

    const kg = Number(body?.yieldKg);
    if (Number.isFinite(kg) && kg > 0) {
      const year = Number(body?.year) || new Date().getFullYear();
      const existing = tree.harvests.find((h) => h.year === year);
      if (existing) existing.kg = Math.round(kg * 10) / 10;
      else tree.harvests.push({ year, kg: Math.round(kg * 10) / 10 });
      tree.harvests.sort((a, b) => a.year - b.year);
    }

    const photo = typeof body?.photo === "string" && body.photo.startsWith("/") ? body.photo : undefined;
    if (photo) {
      const month = new Date().getMonth() + 1;
      const season = month <= 2 || month === 12 ? "winter" : month <= 5 ? "spring" : month <= 8 ? "summer" : "autumn";
      tree.photos.push({ src: photo, year: new Date().getFullYear(), season });
    }

    const note = typeof body?.note === "string" ? body.note.slice(0, 1000) : "";
    if (note || photo) {
      const today = new Date().toISOString().slice(0, 10);
      tree.updates.push({
        id: randomId("upd-"),
        date: today,
        author: user.name,
        en: note || "Record updated by the estate office.",
        de: note || "Akte vom Gutsbüro aktualisiert.",
        photo,
      });
      tree.lastInspection = today;
    }
    return { code: tree.code, status: tree.status };
  });

  if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, ...result });
}
