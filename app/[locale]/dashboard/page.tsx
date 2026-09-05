import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import DashboardClient, { type DashboardData } from "./DashboardClient";
import SignOutButton from "@/components/site/SignOutButton";
import { getDict, resolveLocale } from "@/lib/i18n";
import { getSessionUser } from "@/lib/auth";
import { getDb, getOwnerOrders, getOwnerTrees } from "@/lib/db";
import { credit } from "@/lib/photos";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return { title: dict.meta.dashboard.title, description: dict.meta.dashboard.description, robots: { index: false } };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  if (user.role === "worker") redirect(`/${locale}/field`);

  const [db, trees, orders] = await Promise.all([getDb(), getOwnerTrees(user.id), getOwnerOrders(user.id)]);
  const owner = db.owners.find((o) => o.id === user.id)!;

  const data: DashboardData = {
    owner: { name: owner.name, since: owner.since, email: owner.email },
    trees: trees.map((tree) => ({
      code: tree.code,
      parcel: tree.parcel,
      row: tree.row,
      cultivar: tree.cultivar,
      planted: tree.planted,
      phaseLabel: dict.phases[tree.phase],
      healthLabel: dict.health[tree.health],
      estimateKg: tree.estimateKg,
      lastInspection: tree.lastInspection,
      soldAt: tree.soldAt,
      photos: tree.photos.map((photo) => ({
        src: photo.src,
        blur: credit(photo.src)?.blur,
        year: photo.year,
        seasonLabel: dict.gallery.seasons[photo.season],
      })),
      harvests: tree.harvests,
      updates: tree.updates.map((update) => ({
        id: update.id,
        date: update.date,
        author: update.author,
        text: locale === "de" ? update.de : update.en,
      })),
    })),
    orders: orders.map((order) => ({
      id: order.id,
      date: order.date,
      total: order.total,
      codes: order.items.map((i) => i.code),
    })),
    reports: db.reports.map((report) => ({
      id: report.id,
      year: report.year,
      seasonLabel: dict.gallery.seasons[report.season],
      title: report[locale].title,
      body: report[locale].body,
    })),
    announcements: db.announcements.map((item) => ({
      id: item.id,
      date: item.date,
      title: item[locale].title,
      body: item[locale].body,
    })),
  };

  return (
    <div className="bg-beige/25 pb-24 pt-32">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{dict.dashboard.welcome}</p>
            <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-none">{owner.name}</h1>
            <p className="mt-2 text-[0.88rem] text-ink/55">{dict.dashboard.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${locale}/orchard`} className="btn btn-primary !py-2.5 !text-[0.82rem]">
              <Plus size={15} />
              {dict.dashboard.buyMore}
            </Link>
            <SignOutButton locale={locale} label={dict.nav.logout} />
          </div>
        </div>

        <div className="mt-10">
          <DashboardClient data={data} locale={locale} dict={dict} />
        </div>
      </div>
    </div>
  );
}
