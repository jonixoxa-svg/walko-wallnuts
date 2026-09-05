import { getStats } from "@/lib/db";

/** Health check for Render: also proves the orchard database is readable. */
export async function GET() {
  try {
    const stats = await getStats();
    return Response.json(
      { ok: true, trees: stats.total, available: stats.available, sold: stats.sold },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return Response.json({ ok: false, error: (error as Error).message }, { status: 503 });
  }
}
