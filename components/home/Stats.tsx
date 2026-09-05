import Counter from "@/components/ui/Counter";
import Progress from "@/components/ui/Progress";
import Reveal from "@/components/ui/Reveal";
import type { Dict } from "@/lib/i18n";
import type { Stats as StatsData } from "@/lib/db";
import { site, type Locale, formatDate } from "@/lib/site";

export default function Stats({ dict, locale, stats }: { dict: Dict; locale: Locale; stats: StatsData }) {
  const items = [
    { label: dict.home.stats.totalTrees, value: stats.total, accent: false },
    { label: dict.home.stats.treesSold, value: stats.sold, accent: false },
    { label: dict.home.stats.treesAvailable, value: stats.available, accent: true },
    { label: dict.home.stats.pricePerTree, value: site.totals.pricePerTree, prefix: "€", accent: false },
  ];

  return (
    <section className="relative -mt-16 z-10">
      <div className="shell">
        <Reveal className="card overflow-hidden">
          <div className="grid gap-px bg-[color-mix(in_srgb,var(--color-walnut)_10%,transparent)] sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.label} className="bg-white px-6 py-8 text-center lg:py-10">
                <p
                  className={`font-display text-[clamp(2.1rem,4vw,3rem)] leading-none ${
                    item.accent ? "text-forest" : "text-ink"
                  }`}
                >
                  <Counter value={item.value} prefix={item.prefix} locale={locale} />
                </p>
                <p className="mt-3 text-[0.72rem] uppercase tracking-[0.18em] text-ink/55">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-walnut/10 bg-white px-6 py-7 md:px-10">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="text-[0.85rem] text-ink/70">
                <span className="font-display text-2xl text-forest">{stats.soldPercent}%</span>{" "}
                {dict.home.stats.progressLabel}
              </p>
              <p className="text-[0.72rem] text-ink/45">
                {dict.home.stats.updated}: {formatDate(stats.updatedAt, locale)}
              </p>
            </div>
            <Progress value={stats.soldPercent} label={dict.home.stats.progressLabel} className="mt-4" />
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[0.72rem] text-ink/55">
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-2 w-2 rounded-full bg-forest-600" /> {dict.common.sold}: {stats.sold}
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-2 w-2 rounded-full bg-gold" /> {dict.common.reserved}: {stats.reserved}
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-2 w-2 rounded-full bg-beige-dark" /> {dict.common.available}:{" "}
                {stats.available}
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
