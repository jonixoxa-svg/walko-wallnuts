import { getDb, getTree } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ownershipCertificate } from "@/lib/pdf";
import { resolveLocale } from "@/lib/i18n";

/** Ownership certificate PDF. Only the owner, the estate team or the buying session may fetch it. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get("locale"));
  const orderId = url.searchParams.get("order");

  const tree = await getTree(code);
  if (!tree || tree.status !== "sold" || !tree.ownerId) {
    return new Response("Not found", { status: 404 });
  }

  const db = await getDb();
  const user = await getSessionUser();
  const order = orderId ? db.orders.find((o) => o.id === orderId) : undefined;
  const viaOrder = Boolean(order && order.items.some((i) => i.code === tree.code));
  const allowed =
    viaOrder || (user && (user.role === "admin" || user.role === "worker" || user.id === tree.ownerId));
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const owner = db.owners.find((o) => o.id === tree.ownerId);
  const gift = db.orders.find((o) => o.items.some((i) => i.code === tree.code))?.gift;

  const pdf = await ownershipCertificate({
    tree,
    ownerName: gift?.name || owner?.name || "—",
    since: tree.soldAt ?? owner?.since ?? "—",
    locale,
    giftMessage: gift?.message,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${tree.code}-certificate.pdf"`,
    },
  });
}
