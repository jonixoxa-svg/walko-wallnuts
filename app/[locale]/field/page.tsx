import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FieldClient from "./FieldClient";
import SignOutButton from "@/components/site/SignOutButton";
import { getDict, resolveLocale } from "@/lib/i18n";
import { getSessionUser } from "@/lib/auth";
import { getTrees } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return { title: dict.meta.field.title, description: dict.meta.field.description, robots: { index: false } };
}

export default async function FieldPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  if (user.role !== "worker" && user.role !== "admin") redirect(`/${locale}/dashboard`);

  const trees = await getTrees();
  const recent = trees
    .flatMap((tree) => tree.updates.map((update) => ({ code: tree.code, date: update.date, author: update.author, text: locale === "de" ? update.de : update.en })))
    .filter((entry) => entry.author === user.name)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="bg-beige/25 pb-24 pt-32">
      <div className="shell max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{dict.field.title}</p>
            <h1 className="mt-3 font-display text-[clamp(1.9rem,3.6vw,2.6rem)] leading-none">{dict.field.lead}</h1>
          </div>
          <SignOutButton locale={locale} label={dict.nav.logout} />
        </div>

        <div className="mt-10">
          <FieldClient locale={locale} dict={dict} workerName={user.name} recent={recent} />
        </div>
      </div>
    </div>
  );
}
