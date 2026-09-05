import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminClient, { type AdminData } from "./AdminClient";
import SignOutButton from "@/components/site/SignOutButton";
import { getDict, resolveLocale } from "@/lib/i18n";
import { getSessionUser } from "@/lib/auth";
import { getDb, getStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return { title: dict.meta.admin.title, description: dict.meta.admin.description, robots: { index: false } };
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  if (user.role !== "admin") redirect(`/${locale}/dashboard`);

  const [db, stats] = await Promise.all([getDb(), getStats()]);
  const ownerName = new Map(db.owners.map((o) => [o.id, o.name]));

  const data: AdminData = {
    kpis: {
      revenue: stats.revenue,
      orders: db.orders.length,
      owners: stats.owners,
      available: stats.available,
      reserved: stats.reserved,
      sold: stats.sold,
      harvest: stats.lastHarvestTotal,
    },
    trees: db.trees.map((tree) => ({
      code: tree.code,
      parcel: tree.parcel,
      row: tree.row,
      cultivar: tree.cultivar,
      planted: tree.planted,
      status: tree.status,
      owner: tree.ownerId ? ownerName.get(tree.ownerId) : undefined,
      health: dict.health[tree.health],
      phase: dict.phases[tree.phase],
      lastYield: tree.harvests[tree.harvests.length - 1]?.kg,
      lastInspection: tree.lastInspection,
    })),
    orders: db.orders.slice(0, 300).map((order) => ({
      id: order.id,
      date: order.date,
      name: order.name,
      email: order.email,
      codes: order.items.map((i) => i.code),
      total: order.total,
      status: order.status,
      method: order.method,
    })),
    owners: db.owners
      .filter((o) => o.role === "owner")
      .map((owner) => ({
        id: owner.id,
        name: owner.name,
        email: owner.email,
        country: owner.country,
        since: owner.since,
        trees: db.trees.filter((t) => t.ownerId === owner.id).length,
        lastLogin: owner.lastLogin,
      }))
      .sort((a, b) => b.trees - a.trees),
    announcements: db.announcements.map((item) => ({ id: item.id, date: item.date, title: item[locale].title })),
    journal: db.journal.map((entry) => ({
      id: entry.id,
      date: entry.date,
      title: entry[locale].title,
      parcel: entry.parcel,
    })),
  };

  return (
    <div className="bg-beige/25 pb-24 pt-32">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{dict.admin.title}</p>
            <h1 className="mt-3 font-display text-[clamp(1.9rem,3.6vw,2.6rem)] leading-none">{user.name}</h1>
          </div>
          <SignOutButton locale={locale} label={dict.nav.logout} />
        </div>

        <div className="mt-10">
          <AdminClient data={data} locale={locale} dict={dict} />
        </div>
      </div>
    </div>
  );
}
