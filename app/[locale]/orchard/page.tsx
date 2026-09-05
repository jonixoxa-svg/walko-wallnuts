import type { Metadata } from "next";
import OrchardMap, { type MapTree } from "@/components/map/OrchardMap";
import Reveal from "@/components/ui/Reveal";
import { getDict, resolveLocale } from "@/lib/i18n";
import { getStats, getTrees } from "@/lib/db";
import { CULTIVARS, PARCELS } from "@/lib/model";
import Progress from "@/components/ui/Progress";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return {
    title: dict.meta.orchard.title,
    description: dict.meta.orchard.description,
    alternates: { canonical: `/${locale}/orchard`, languages: { en: "/en/orchard", de: "/de/orchard" } },
  };
}

export default async function OrchardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);
  const [trees, stats] = await Promise.all([getTrees(), getStats()]);

  const compact: MapTree[] = trees.map((t) => ({
    n: t.n,
    p: t.parcel,
    r: t.row,
    c: t.col,
    x: t.x,
    y: t.y,
    cv: CULTIVARS.indexOf(t.cultivar),
    s: t.status === "available" ? 0 : t.status === "reserved" ? 1 : 2,
    pl: t.planted,
    e: t.estimateKg,
  }));

  return (
    <div className="bg-beige/25 pb-24 pt-32">
      <div className="shell">
        <Reveal>
          <p className="eyebrow">{dict.orchard.eyebrow}</p>
          <h1 className="mt-4 max-w-2xl font-display text-[clamp(2.1rem,4.4vw,3.4rem)] leading-[1.06]">
            {dict.orchard.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-ink/65">{dict.orchard.lead}</p>
        </Reveal>

        <Reveal delay={80} className="mt-8 flex flex-wrap items-center gap-6 rounded-xl bg-white/70 px-5 py-4">
          <div className="min-w-[180px] flex-1">
            <p className="text-[0.78rem] text-ink/60">
              <span className="font-display text-xl text-forest">{stats.available}</span> {dict.common.available} ·{" "}
              {stats.sold} {dict.common.sold}
            </p>
            <Progress value={stats.soldPercent} className="mt-2" label={dict.home.stats.progressLabel} />
          </div>
          <p className="text-[0.78rem] text-ink/55">
            {stats.soldPercent}% {dict.home.stats.progressLabel}
          </p>
        </Reveal>

        <div className="mt-8">
          <OrchardMap
            trees={compact}
            cultivars={[...CULTIVARS]}
            parcels={[...PARCELS]}
            locale={locale}
            dict={dict}
          />
        </div>
      </div>
    </div>
  );
}
