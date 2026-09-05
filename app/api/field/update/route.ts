import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { mutate } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { randomId } from "@/lib/crypto";
import type { Health, Phase } from "@/lib/model";

const HEALTHS: Health[] = ["excellent", "good", "fair", "attention"];
const PHASES: Phase[] = ["dormant", "blooming", "growing", "ripening", "harvested"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_UPLOAD = 12 * 1024 * 1024;

/** Field inspection: what the worker sees in the orchard lands in the owner's dashboard. */
export async function POST(request: Request) {
  const user = await requireRole(["worker", "admin"]);
  if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await request.formData();
  const code = String(form.get("code") ?? "").toUpperCase();
  const health = String(form.get("health") ?? "");
  const phase = String(form.get("phase") ?? "");
  const note = String(form.get("note") ?? "").slice(0, 1000);
  const yieldKg = Number(form.get("yieldKg"));
  const file = form.get("photo");

  if (!/^WT-\d{4}$/.test(code)) return NextResponse.json({ error: "invalid_code" }, { status: 400 });

  let photoPath: string | undefined;
  if (file && typeof file === "object" && "arrayBuffer" in file) {
    const blob = file as File;
    if (blob.size > 0) {
      if (blob.size > MAX_UPLOAD) return NextResponse.json({ error: "file_too_large" }, { status: 413 });
      const buffer = Buffer.from(await blob.arrayBuffer());
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      const name = `${code}-${Date.now()}.webp`;
      try {
        await sharp(buffer, { failOn: "none" })
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toFile(path.join(UPLOAD_DIR, name));
        photoPath = `/uploads/${name}`;
      } catch {
        return NextResponse.json({ error: "invalid_image" }, { status: 400 });
      }
    }
  }

  const result = await mutate((db) => {
    const tree = db.trees.find((t) => t.code === code);
    if (!tree) return null;

    const today = new Date().toISOString().slice(0, 10);
    if (HEALTHS.includes(health as Health)) tree.health = health as Health;
    if (PHASES.includes(phase as Phase)) tree.phase = phase as Phase;
    if (Number.isFinite(yieldKg) && yieldKg > 0) {
      const year = new Date().getFullYear();
      const existing = tree.harvests.find((h) => h.year === year);
      if (existing) existing.kg = Math.round(yieldKg * 10) / 10;
      else tree.harvests.push({ year, kg: Math.round(yieldKg * 10) / 10 });
    }
    tree.lastInspection = today;
    if (photoPath) {
      const month = new Date().getMonth() + 1;
      const season = month <= 2 || month === 12 ? "winter" : month <= 5 ? "spring" : month <= 8 ? "summer" : "autumn";
      tree.photos.push({ src: photoPath, year: new Date().getFullYear(), season });
    }
    if (note || photoPath || Number.isFinite(yieldKg)) {
      tree.updates.push({
        id: randomId("upd-"),
        date: today,
        author: user.name,
        en: note || "Inspection recorded in the orchard.",
        de: note || "Kontrolle in der Anlage erfasst.",
        phase: PHASES.includes(phase as Phase) ? (phase as Phase) : undefined,
        health: HEALTHS.includes(health as Health) ? (health as Health) : undefined,
        photo: photoPath,
        yieldKg: Number.isFinite(yieldKg) && yieldKg > 0 ? yieldKg : undefined,
      });
    }
    return { code: tree.code, photo: photoPath, updates: tree.updates.length };
  });

  if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, ...result });
}
