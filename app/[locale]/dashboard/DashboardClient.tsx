"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Bell, Download, FileText, Leaf, TreeDeciduous } from "lucide-react";
import YieldChart from "@/components/tree/YieldChart";
import type { Dict } from "@/lib/i18n";
import { formatDate, formatPrice, type Locale } from "@/lib/site";

export interface DashboardTree {
  code: string;
  parcel: string;
  row: number;
  cultivar: string;
  planted: number;
  phaseLabel: string;
  healthLabel: string;
  estimateKg: number;
  lastInspection: string;
  soldAt?: string;
  photos: { src: string; blur?: string; year: number; seasonLabel: string }[];
  harvests: { year: number; kg: number }[];
  updates: { id: string; date: string; author: string; text: string }[];
}

export interface DashboardData {
  owner: { name: string; since: string; email: string };
  trees: DashboardTree[];
  orders: { id: string; date: string; total: number; codes: string[] }[];
  reports: { id: string; title: string; body: string; year: number; seasonLabel: string }[];
  announcements: { id: string; date: string; title: string; body: string }[];
}

const TABS = ["trees", "production", "reports", "documents", "news"] as const;
type Tab = (typeof TABS)[number];

export default function DashboardClient({
  data,
  locale,
  dict,
}: {
  data: DashboardData;
  locale: Locale;
  dict: Dict;
}) {
  const [tab, setTab] = useState<Tab>("trees");
  const [openTree, setOpenTree] = useState<string | null>(data.trees[0]?.code ?? null);

  const years = Array.from(new Set(data.trees.flatMap((t) => t.harvests.map((h) => h.year)))).sort();
  const totals = years.map((year) => ({
    year,
    kg: Math.round(data.trees.reduce((sum, t) => sum + (t.harvests.find((h) => h.year === year)?.kg ?? 0), 0) * 10) / 10,
  }));
  const estimateTotal = Math.round(data.trees.reduce((s, t) => s + t.estimateKg, 0) * 10) / 10;
  const lastHarvest = totals[totals.length - 1];

  const summary = [
    { label: dict.dashboard.summary.trees, value: String(data.trees.length) },
    {
      label: dict.dashboard.summary.lastHarvest,
      value: lastHarvest ? `${lastHarvest.kg} ${dict.common.kg}` : "—",
      note: lastHarvest ? String(lastHarvest.year) : undefined,
    },
    { label: dict.dashboard.summary.nextEstimate, value: `≈ ${estimateTotal} ${dict.common.kg}`, note: "2026" },
    { label: dict.dashboard.summary.since, value: formatDate(data.owner.since, locale) },
  ];

  const tabLabels: Record<Tab, string> = {
    trees: dict.dashboard.tabs.trees,
    production: dict.dashboard.tabs.production,
    reports: dict.dashboard.tabs.reports,
    documents: dict.dashboard.tabs.documents,
    news: dict.dashboard.tabs.news,
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="card px-5 py-6">
            <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink/45">{item.label}</p>
            <p className="mt-2 font-display text-3xl text-forest">{item.value}</p>
            {item.note && <p className="text-[0.75rem] text-ink/45">{item.note}</p>}
          </div>
        ))}
      </div>

      <div className="scrollbar-thin mt-10 flex gap-1 overflow-x-auto border-b border-walnut/12">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-current={tab === t}
            className={`whitespace-nowrap px-4 py-3 text-[0.85rem] transition-colors ${
              tab === t ? "border-b-2 border-forest font-medium text-forest" : "text-ink/55 hover:text-ink"
            }`}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "trees" && (
          <div className="space-y-5">
            {data.trees.length === 0 && <p className="text-[0.9rem] text-ink/60">{dict.dashboard.noTrees}</p>}
            {data.trees.map((tree) => {
              const open = openTree === tree.code;
              const latest = tree.photos[tree.photos.length - 1];
              return (
                <article key={tree.code} className="card overflow-hidden">
                  <div className="grid gap-5 p-5 sm:grid-cols-[220px_1fr]">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-beige">
                      {latest && (
                        <Image
                          src={latest.src}
                          alt={tree.code}
                          fill
                          sizes="220px"
                          quality={65}
                          placeholder={latest.blur ? "blur" : undefined}
                          blurDataURL={latest.blur}
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-display text-2xl">{tree.code}</h3>
                        <span className="badge badge-sold">{tree.phaseLabel}</span>
                      </div>
                      <p className="mt-1 text-[0.84rem] text-ink/55">
                        {tree.cultivar} · {dict.common.parcel} {tree.parcel}, {dict.common.row} {tree.row} ·{" "}
                        {dict.common.planted} {tree.planted}
                      </p>

                      <dl className="mt-4 grid grid-cols-2 gap-2 text-[0.76rem] sm:grid-cols-4">
                        <div className="rounded-lg bg-beige/45 px-3 py-2">
                          <dt className="text-ink/50">{dict.dashboard.treeCard.health}</dt>
                          <dd className="mt-0.5 font-medium">{tree.healthLabel}</dd>
                        </div>
                        <div className="rounded-lg bg-beige/45 px-3 py-2">
                          <dt className="text-ink/50">{dict.dashboard.treeCard.lastYield}</dt>
                          <dd className="mt-0.5 font-medium">
                            {tree.harvests.length
                              ? `${tree.harvests[tree.harvests.length - 1].kg} ${dict.common.kg}`
                              : "—"}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-beige/45 px-3 py-2">
                          <dt className="text-ink/50">{dict.common.estimate} 2026</dt>
                          <dd className="mt-0.5 font-medium">
                            ≈ {tree.estimateKg} {dict.common.kg}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-beige/45 px-3 py-2">
                          <dt className="text-ink/50">{dict.dashboard.inspection}</dt>
                          <dd className="mt-0.5 font-medium">{formatDate(tree.lastInspection, locale)}</dd>
                        </div>
                      </dl>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => setOpenTree(open ? null : tree.code)} className="btn btn-outline !py-2 !text-[0.78rem]">
                          <Leaf size={14} />
                          {dict.dashboard.timeline}
                        </button>
                        <Link href={`/${locale}/tree/${tree.code}`} className="btn btn-outline !py-2 !text-[0.78rem]">
                          <TreeDeciduous size={14} />
                          {dict.dashboard.treeCard.open}
                        </Link>
                        <a
                          href={`/api/certificate/${tree.code}?locale=${locale}`}
                          className="btn btn-outline !py-2 !text-[0.78rem]"
                        >
                          <Download size={14} />
                          {dict.dashboard.downloadCertificate}
                        </a>
                      </div>
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-walnut/10 bg-beige/25 p-5">
                      <p className="text-[0.8rem] text-ink/55">{dict.dashboard.timelineLead}</p>
                      <div className="scrollbar-thin mt-4 flex gap-3 overflow-x-auto pb-2">
                        {tree.photos.map((photo, i) => (
                          <figure key={photo.src + i} className="w-40 shrink-0">
                            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                              <Image src={photo.src} alt="" fill sizes="160px" quality={60} className="object-cover" />
                            </div>
                            <figcaption className="mt-1.5 text-[0.72rem] text-ink/55">
                              {photo.seasonLabel} {photo.year}
                            </figcaption>
                          </figure>
                        ))}
                      </div>

                      <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        <div>
                          <h4 className="text-[0.75rem] uppercase tracking-[0.16em] text-ink/45">
                            {dict.dashboard.production.title}
                          </h4>
                          <div className="mt-3">
                            <YieldChart
                              data={[
                                ...tree.harvests.slice(-5),
                                { year: 2026, kg: tree.estimateKg, estimate: true },
                              ]}
                              dict={dict}
                              height={150}
                            />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[0.75rem] uppercase tracking-[0.16em] text-ink/45">
                            {dict.tree.updates}
                          </h4>
                          <ol className="mt-3 space-y-3 border-l border-walnut/15 pl-4">
                            {[...tree.updates].reverse().slice(0, 4).map((update) => (
                              <li key={update.id}>
                                <p className="text-[0.7rem] uppercase tracking-wider text-ink/45">
                                  {formatDate(update.date, locale)} · {update.author}
                                </p>
                                <p className="mt-1 text-[0.84rem] leading-relaxed text-ink/70">{update.text}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {tab === "production" && (
          <div className="card p-6">
            <h2 className="font-display text-2xl">{dict.dashboard.production.title}</h2>
            <p className="mt-1 text-[0.85rem] text-ink/55">{dict.dashboard.production.lead}</p>
            {totals.length ? (
              <>
                <div className="mt-6">
                  <YieldChart data={[...totals, { year: 2026, kg: estimateTotal, estimate: true }]} dict={dict} height={220} />
                </div>
                <table className="mt-8 w-full text-left text-[0.82rem]">
                  <thead className="text-[0.7rem] uppercase tracking-wider text-ink/50">
                    <tr>
                      <th className="py-2">{dict.common.treeId}</th>
                      {years.slice(-5).map((year) => (
                        <th key={year} className="py-2 text-right">
                          {year}
                        </th>
                      ))}
                      <th className="py-2 text-right">2026*</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trees.map((tree) => (
                      <tr key={tree.code} className="border-t border-walnut/10">
                        <td className="py-2 font-medium">{tree.code}</td>
                        {years.slice(-5).map((year) => (
                          <td key={year} className="py-2 text-right text-ink/70">
                            {tree.harvests.find((h) => h.year === year)?.kg ?? "—"}
                          </td>
                        ))}
                        <td className="py-2 text-right text-gold">≈ {tree.estimateKg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 text-[0.72rem] text-ink/45">* {dict.dashboard.production.estimateLabel}</p>
              </>
            ) : (
              <p className="mt-4 text-[0.88rem] text-ink/60">{dict.dashboard.production.empty}</p>
            )}
          </div>
        )}

        {tab === "reports" && (
          <div className="space-y-4">
            <p className="text-[0.9rem] text-ink/60">{dict.dashboard.reports.lead}</p>
            {data.reports.map((report) => (
              <article key={report.id} className="card p-6">
                <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink/45">
                  {report.seasonLabel} {report.year}
                </p>
                <h3 className="mt-2 font-display text-xl">{report.title}</h3>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-ink/70">{report.body}</p>
              </article>
            ))}
          </div>
        )}

        {tab === "documents" && (
          <div className="grid gap-4 md:grid-cols-2">
            {data.trees.map((tree) => (
              <a
                key={tree.code}
                href={`/api/certificate/${tree.code}?locale=${locale}`}
                className="card flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5"
              >
                <FileText size={20} className="text-forest" />
                <div className="flex-1">
                  <p className="text-[0.9rem] font-medium">
                    {dict.dashboard.documents.certificate} — {tree.code}
                  </p>
                  <p className="text-[0.76rem] text-ink/50">PDF</p>
                </div>
                <Download size={16} className="text-ink/40" />
              </a>
            ))}
            {data.orders.map((order) => (
              <a
                key={order.id}
                href={`/api/invoice/${order.id}?locale=${locale}`}
                className="card flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5"
              >
                <FileText size={20} className="text-walnut" />
                <div className="flex-1">
                  <p className="text-[0.9rem] font-medium">
                    {dict.dashboard.documents.invoice} — {order.id}
                  </p>
                  <p className="text-[0.76rem] text-ink/50">
                    {formatDate(order.date, locale)} · {formatPrice(order.total, locale)}
                  </p>
                </div>
                <Download size={16} className="text-ink/40" />
              </a>
            ))}
            <Link href={`/${locale}/legal/ownership`} className="card flex items-center gap-4 p-5">
              <FileText size={20} className="text-ink/60" />
              <p className="text-[0.9rem] font-medium">{dict.dashboard.documents.agreement}</p>
            </Link>
          </div>
        )}

        {tab === "news" && (
          <div className="space-y-4">
            {data.announcements.length === 0 && <p className="text-[0.9rem] text-ink/60">{dict.dashboard.news.empty}</p>}
            {data.announcements.map((item) => (
              <article key={item.id} className="card p-6">
                <p className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.14em] text-ink/45">
                  <Bell size={13} /> {formatDate(item.date, locale)}
                </p>
                <h3 className="mt-2 font-display text-xl">{item.title}</h3>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-ink/70">{item.body}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
