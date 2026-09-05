import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, MapPin, QrCode } from "lucide-react";
import TreeGallery from "@/components/tree/TreeGallery";
import YieldChart from "@/components/tree/YieldChart";
import GrowthStory from "@/components/tree/GrowthStory";
import ClipPlayer from "@/components/tree/ClipPlayer";
import BuyBox from "@/components/tree/BuyBox";
import TreeCard from "@/components/tree/TreeCard";
import Reveal from "@/components/ui/Reveal";
import { getDict, resolveLocale } from "@/lib/i18n";
import { getTree, getTrees } from "@/lib/db";
import { credit } from "@/lib/photos";
import { baseUrl, formatDate, site } from "@/lib/site";
import { latestPhoto, toCardData } from "@/lib/view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale, code } = await params;
  const dict = getDict(locale);
  const tree = await getTree(code);
  if (!tree) return { title: dict.notFound.title };
  const title = `${tree.code} · ${tree.cultivar}, ${dict.common.parcel} ${tree.parcel}`;
  const description =
    locale === "de"
      ? `Walnussbaum ${tree.code}, ${tree.cultivar}, gepflanzt ${tree.planted}. Zustand, Fotos, Ernte und Baumpass.`
      : `Walnut tree ${tree.code}, ${tree.cultivar}, planted ${tree.planted}. Condition, photographs, harvest and digital passport.`;
  return {
    title,
    description,
    alternates: { canonical: `/${locale}/tree/${tree.code}` },
    openGraph: { title, description, images: [{ url: latestPhoto(tree) }] },
  };
}

export default async function TreePage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale: rawLocale, code } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDict(locale);
  const tree = await getTree(code);
  if (!tree) notFound();

  const allTrees = await getTrees();
  const neighbours = allTrees
    .filter((t) => t.parcel === tree.parcel && t.row === tree.row && t.code !== tree.code)
    .slice(0, 3);

  const shots = tree.photos.map((p) => ({
    src: p.src,
    blur: credit(p.src)?.blur,
    year: p.year,
    season: p.season,
    credit: p.credit ? `${p.credit} (${p.license})` : undefined,
  }));

  const chart = [
    ...tree.harvests.slice(-6).map((h) => ({ year: h.year, kg: h.kg })),
    { year: 2026, kg: tree.estimateKg, estimate: true },
  ];

  const facts = [
    { label: dict.common.treeId, value: tree.code },
    { label: dict.common.cultivar, value: tree.cultivar },
    { label: dict.common.planted, value: String(tree.planted) },
    { label: dict.common.age, value: `${2026 - tree.planted} ${dict.common.years}` },
    { label: dict.common.parcel, value: `${tree.parcel} · ${dict.common.row} ${tree.row}` },
    { label: dict.common.health, value: dict.health[tree.health] },
    { label: dict.common.phase, value: dict.phases[tree.phase] },
    { label: dict.common.lastInspection, value: formatDate(tree.lastInspection, locale) },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${site.brand} — ${tree.code}`,
    sku: tree.code,
    category: locale === "de" ? "Walnussbaum-Eigentum" : "Walnut tree ownership",
    description:
      locale === "de"
        ? `Nummerierter Walnussbaum ${tree.code} (${tree.cultivar}, gepflanzt ${tree.planted}) in der Anlage ${site.brand}.`
        : `Numbered walnut tree ${tree.code} (${tree.cultivar}, planted ${tree.planted}) at ${site.brand}.`,
    image: `${baseUrl()}${latestPhoto(tree)}`,
    brand: { "@type": "Brand", name: site.brand },
    offers: {
      "@type": "Offer",
      price: site.totals.pricePerTree,
      priceCurrency: site.totals.currency,
      availability: tree.status === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: `${baseUrl()}/${locale}/tree/${tree.code}`,
    },
  };

  return (
    <div className="bg-beige/25 pb-24 pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="shell">
        <Link
          href={`/${locale}/orchard`}
          className="link-underline inline-flex items-center gap-2 text-[0.8rem] text-ink/60"
        >
          <ArrowLeft size={14} /> {dict.tree.backToMap}
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <Reveal>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-[clamp(2rem,4vw,3rem)] leading-none">{tree.code}</h1>
                <span className={`badge badge-${tree.status}`}>
                  {tree.status === "available"
                    ? dict.common.available
                    : tree.status === "reserved"
                      ? dict.common.reserved
                      : dict.common.sold}
                </span>
              </div>
              <p className="mt-2 text-[0.92rem] text-ink/60">
                {tree.cultivar} · {dict.common.parcel} {tree.parcel}, {dict.common.row} {tree.row} ·{" "}
                {dict.common.planted} {tree.planted}
              </p>
            </Reveal>

            <Reveal delay={60} className="mt-7">
              <TreeGallery shots={shots} code={tree.code} dict={dict} locale={locale} />
            </Reveal>

            <Reveal delay={70} className="mt-12">
              <h2 className="font-display text-2xl">{dict.tree.growthTitle}</h2>
              <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-ink/60">{dict.tree.growthLead}</p>
              <div className="mt-6">
                <GrowthStory tree={tree} dict={dict} locale={locale} />
              </div>
            </Reveal>

            <Reveal delay={80} className="mt-12">
              <h2 className="font-display text-2xl">{dict.tree.videoTitle}</h2>
              <div className="mt-4">
                <ClipPlayer clips={tree.clips} dict={dict} locale={locale} />
              </div>
            </Reveal>

            <Reveal delay={80} className="mt-12">
              <h2 className="font-display text-2xl">{dict.tree.passportTitle}</h2>
              <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-ink/60">{dict.tree.passportLead}</p>
              <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-walnut/12 bg-walnut/10 sm:grid-cols-2 lg:grid-cols-4">
                {facts.map((fact) => (
                  <div key={fact.label} className="bg-white px-4 py-4">
                    <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink/45">{fact.label}</dt>
                    <dd className="mt-1.5 text-[0.92rem] font-medium text-ink">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={80} className="mt-12 grid gap-8 md:grid-cols-2">
              <div className="card p-6">
                <h3 className="font-display text-xl">{dict.tree.harvestHistory}</h3>
                <p className="mt-1 text-[0.8rem] text-ink/55">{dict.dashboard.production.lead}</p>
                <div className="mt-5">
                  <YieldChart data={chart} dict={dict} />
                </div>
                <p className="mt-4 text-[0.75rem] leading-relaxed text-ink/50">{dict.tree.estimateNote}</p>
              </div>

              <div className="card p-6">
                <h3 className="flex items-center gap-2 font-display text-xl">
                  <QrCode size={18} /> {dict.tree.qrTitle}
                </h3>
                <p className="mt-1 text-[0.8rem] text-ink/55">{dict.tree.qrLead}</p>
                <div className="mt-5 flex items-center gap-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/qr/${tree.code}`}
                    alt={`QR ${tree.code}`}
                    width={132}
                    height={132}
                    className="rounded-lg bg-beige/40 p-2"
                  />
                  <div className="space-y-2 text-[0.8rem]">
                    <p className="text-ink/60">
                      {site.domain}/t/{tree.code}
                    </p>
                    <a href={`/api/qr/${tree.code}?format=png`} className="btn btn-outline !py-2 !text-[0.78rem]">
                      <Download size={14} />
                      {dict.tree.downloadQr}
                    </a>
                  </div>
                </div>
                <p className="mt-5 flex items-center gap-2 text-[0.78rem] text-ink/55">
                  <MapPin size={14} /> {tree.lat.toFixed(5)}, {tree.lng.toFixed(5)}
                </p>
              </div>
            </Reveal>

            <Reveal delay={80} className="mt-12">
              <h2 className="font-display text-2xl">{dict.tree.updates}</h2>
              <ol className="mt-6 space-y-5 border-l border-walnut/15 pl-6">
                {[...tree.updates].reverse().map((update) => (
                  <li key={update.id} className="relative">
                    <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
                    <p className="text-[0.72rem] uppercase tracking-[0.12em] text-ink/45">
                      {formatDate(update.date, locale)} · {dict.tree.inspectionBy} {update.author}
                    </p>
                    <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink/75">
                      {locale === "de" ? update.de : update.en}
                    </p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>

          <div className="lg:sticky lg:top-24 lg:h-fit">
            <BuyBox
              code={tree.code}
              parcel={tree.parcel}
              cultivar={tree.cultivar}
              photo={latestPhoto(tree)}
              status={tree.status}
              locale={locale}
              dict={dict}
            />
            {tree.status === "sold" && tree.soldAt && (
              <p className="mt-3 text-center text-[0.76rem] text-ink/50">
                {dict.tree.ownerSince} {formatDate(tree.soldAt, locale)}
              </p>
            )}
          </div>
        </div>

        {neighbours.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-2xl">{dict.tree.similar}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {neighbours.map((n) => (
                <TreeCard key={n.code} tree={toCardData(n, dict)} locale={locale} dict={dict} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
