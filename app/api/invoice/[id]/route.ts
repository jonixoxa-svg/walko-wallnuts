import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { invoicePdf } from "@/lib/pdf";
import { resolveLocale } from "@/lib/i18n";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = resolveLocale(new URL(request.url).searchParams.get("locale"));
  const db = await getDb();
  const order = db.orders.find((o) => o.id === id);
  if (!order) return new Response("Not found", { status: 404 });

  const user = await getSessionUser();
  const allowed = user && (user.role === "admin" || user.id === order.ownerId);
  // A fresh buyer reaches the invoice straight from the confirmation page, where
  // the session cookie was just set, so the same check covers both cases.
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const pdf = await invoicePdf({ order, locale });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${order.id}.pdf"`,
    },
  });
}
