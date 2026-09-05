import { NextResponse } from "next/server";
import { getTree } from "@/lib/db";
import { getDict, resolveLocale } from "@/lib/i18n";
import { credit } from "@/lib/photos";
import { latestPhoto } from "@/lib/view";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const locale = resolveLocale(new URL(request.url).searchParams.get("locale"));
  const dict = getDict(locale);
  const tree = await getTree(code);

  if (!tree) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const photo = latestPhoto(tree);
  const update = tree.updates[tree.updates.length - 1];

  return NextResponse.json({
    code: tree.code,
    parcel: tree.parcel,
    row: tree.row,
    cultivar: tree.cultivar,
    planted: tree.planted,
    status: tree.status,
    healthLabel: dict.health[tree.health],
    phaseLabel: dict.phases[tree.phase],
    estimateKg: tree.estimateKg,
    lastInspection: tree.lastInspection,
    photo,
    blur: credit(photo)?.blur,
    harvests: tree.harvests,
    update: update ? { date: update.date, text: locale === "de" ? update.de : update.en, author: update.author } : undefined,
  });
}
