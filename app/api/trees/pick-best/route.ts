import { NextResponse } from "next/server";
import { getTrees } from "@/lib/db";
import { latestPhoto } from "@/lib/view";

/**
 * "Choose the best available tree for me" — ranks free trees by condition,
 * age and recorded harvest history.
 */
export async function GET(request: Request) {
  const exclude = new Set(
    (new URL(request.url).searchParams.get("exclude") || "")
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
  );

  const trees = await getTrees();
  const healthScore = { excellent: 3, good: 2, fair: 1, attention: 0 } as const;

  const best = trees
    .filter((t) => t.status === "available" && !exclude.has(t.code))
    .map((t) => {
      const recent = t.harvests.slice(-3);
      const avg = recent.length ? recent.reduce((s, h) => s + h.kg, 0) / recent.length : 0;
      return { tree: t, score: healthScore[t.health] * 6 + avg + (2026 - t.planted) * 0.4 + t.estimateKg * 0.5 };
    })
    .sort((a, b) => b.score - a.score)[0];

  if (!best) return NextResponse.json({ error: "none_available" }, { status: 404 });

  return NextResponse.json({
    code: best.tree.code,
    parcel: best.tree.parcel,
    row: best.tree.row,
    cultivar: best.tree.cultivar,
    photo: latestPhoto(best.tree),
    estimateKg: best.tree.estimateKg,
  });
}
