import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Download, FileText, KeyRound, TreeDeciduous } from "lucide-react";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import { getDict, resolveLocale } from "@/lib/i18n";
import { getOrder, getTreesByCodes } from "@/lib/db";
import { formatPrice, site } from "@/lib/site";
import { latestPhoto } from "@/lib/view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false } };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { locale: raw, id } = await params;
  const { p: password } = await searchParams;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);

  const order = await getOrder(id);
  if (!order) notFound();
  const trees = await getTreesByCodes(order.items.map((i) => i.code));

  return (
    <div className="bg-beige/25 pb-24 pt-32">
      <div className="shell max-w-4xl">
        <Reveal>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest text-ivory">
            <CheckCircle2 size={26} strokeWidth={1.6} />
          </span>
          <h1 className="mt-6 font-display text-[clamp(2rem,4.4vw,3.2rem)] leading-tight">{dict.order.thanks}</h1>
          <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed text-ink/65">{dict.order.lead}</p>
          <p className="mt-4 text-[0.85rem] text-ink/55">
            {dict.order.orderNumber}: <span className="font-medium text-ink">{order.id}</span> ·{" "}
            {formatPrice(order.total, locale)} · {dict.order.emailNote} {order.email}
          </p>
        </Reveal>

        {password && (
          <Reveal delay={60} className="mt-8">
            <div className="card border-gold/50 bg-gold/8 p-6">
              <h2 className="flex items-center gap-2 font-display text-xl">
                <KeyRound size={18} /> {dict.order.ownerAccess}
              </h2>
              <p className="mt-2 text-[0.88rem] text-ink/65">{dict.order.accessLead}</p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white/70 px-4 py-3">
                  <dt className="text-[0.7rem] uppercase tracking-wider text-ink/45">{dict.common.email}</dt>
                  <dd className="mt-1 text-[0.9rem] font-medium">{order.email}</dd>
                </div>
                <div className="rounded-lg bg-white/70 px-4 py-3">
                  <dt className="text-[0.7rem] uppercase tracking-wider text-ink/45">{dict.order.passwordLabel}</dt>
                  <dd className="mt-1 font-mono text-[0.9rem] font-medium">{password}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[0.75rem] text-ink/50">{dict.order.passwordHint}</p>
            </div>
          </Reveal>
        )}

        <Reveal delay={80} className="mt-10">
          <h2 className="font-display text-2xl">{dict.order.yourTrees}</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {trees.map((tree) => (
              <li key={tree.code} className="card overflow-hidden">
                <Photo
                  src={latestPhoto(tree)}
                  alt={tree.code}
                  className="aspect-[16/10]"
                  sizes="(max-width: 640px) 92vw, 44vw"
                />
                <div className="p-5">
                  <p className="font-display text-xl">{tree.code}</p>
                  <p className="mt-1 text-[0.82rem] text-ink/55">
                    {tree.cultivar} · {dict.common.parcel} {tree.parcel}, {dict.common.row} {tree.row}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/${locale}/tree/${tree.code}`} className="btn btn-outline !py-2 !text-[0.78rem]">
                      <TreeDeciduous size={14} />
                      {dict.common.viewTree}
                    </Link>
                    <a
                      href={`/api/certificate/${tree.code}?locale=${locale}&order=${order.id}`}
                      className="btn btn-outline !py-2 !text-[0.78rem]"
                    >
                      <Download size={14} />
                      {dict.dashboard.documents.certificate}
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={100} className="mt-10 flex flex-wrap gap-3">
          <Link href={`/${locale}/dashboard`} className="btn btn-primary">
            {dict.order.toDashboard}
          </Link>
          <a href={`/api/invoice/${order.id}?locale=${locale}`} className="btn btn-outline">
            <FileText size={15} />
            {dict.order.invoice}
          </a>
        </Reveal>

        {order.demo && (
          <p className="mt-10 rounded-xl border border-gold/40 bg-gold/8 px-5 py-4 text-[0.82rem] leading-relaxed text-ink/70">
            {dict.checkout.demoNote} — {site.brand}
          </p>
        )}
      </div>
    </div>
  );
}
