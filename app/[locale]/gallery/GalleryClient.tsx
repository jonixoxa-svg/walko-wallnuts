"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { formatDate, type Locale } from "@/lib/site";

export interface GalleryItem {
  id: string;
  src: string;
  blur?: string;
  year: number;
  season: "spring" | "summer" | "autumn" | "winter";
  parcel: string;
  date: string;
  title: string;
  body?: string;
  credit?: string;
}

export default function GalleryClient({
  items,
  locale,
  dict,
}: {
  items: GalleryItem[];
  locale: Locale;
  dict: Dict;
}) {
  const [year, setYear] = useState("all");
  const [season, setSeason] = useState("all");
  const [parcel, setParcel] = useState("all");
  const [open, setOpen] = useState<GalleryItem | null>(null);

  const years = useMemo(() => Array.from(new Set(items.map((i) => i.year))).sort((a, b) => b - a), [items]);
  const parcels = useMemo(() => Array.from(new Set(items.map((i) => i.parcel))).sort(), [items]);

  const filtered = items.filter(
    (item) =>
      (year === "all" || String(item.year) === year) &&
      (season === "all" || item.season === season) &&
      (parcel === "all" || item.parcel === parcel)
  );

  const selects = [
    {
      label: dict.gallery.filters.year,
      value: year,
      set: setYear,
      options: [{ value: "all", label: dict.gallery.filters.all }, ...years.map((y) => ({ value: String(y), label: String(y) }))],
    },
    {
      label: dict.gallery.filters.season,
      value: season,
      set: setSeason,
      options: [
        { value: "all", label: dict.gallery.filters.all },
        ...(["spring", "summer", "autumn", "winter"] as const).map((s) => ({ value: s, label: dict.gallery.seasons[s] })),
      ],
    },
    {
      label: dict.gallery.filters.parcel,
      value: parcel,
      set: setParcel,
      options: [{ value: "all", label: dict.gallery.filters.all }, ...parcels.map((p) => ({ value: p, label: p === "all" ? dict.gallery.filters.all : p }))],
    },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {selects.map((select) => (
          <label key={select.label} className="flex items-center gap-2 text-[0.78rem] text-ink/55">
            {select.label}
            <select value={select.value} onChange={(e) => select.set(e.target.value)} className="field !w-auto !py-1.5 !text-[0.8rem]">
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-[0.9rem] text-ink/55">{dict.gallery.empty}</p>
      ) : (
        <div className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
          {filtered.map((item, i) => (
            <button
              key={item.id + i}
              onClick={() => setOpen(item)}
              className="group block w-full overflow-hidden rounded-xl text-left"
            >
              <div className="relative">
                <Image
                  src={item.src}
                  alt={item.title}
                  width={900}
                  height={i % 3 === 0 ? 1200 : 620}
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 31vw"
                  quality={68}
                  placeholder={item.blur ? "blur" : undefined}
                  blurDataURL={item.blur}
                  className="zoom-img h-auto w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-900/70 via-transparent to-transparent opacity-90" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-ivory">
                  <p className="text-[0.68rem] uppercase tracking-[0.16em] text-gold-light">
                    {dict.gallery.seasons[item.season]} {item.year}
                    {item.parcel !== "all" && ` · ${dict.common.parcel} ${item.parcel}`}
                  </p>
                  <p className="mt-1 font-display text-lg leading-tight">{item.title}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-forest-900/92 p-4 animate-[fade-in_0.35s_ease-out]"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-label={open.title}
        >
          <div className="max-h-full w-full max-w-4xl overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl">
              <Image src={open.src} alt={open.title} fill sizes="90vw" quality={80} className="object-cover" />
            </div>
            <div className="mt-4 text-ivory">
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-gold-light">
                {dict.gallery.seasons[open.season]} {open.year} · {formatDate(open.date, locale)}
              </p>
              <h2 className="mt-2 font-display text-2xl">{open.title}</h2>
              {open.body && <p className="mt-3 max-w-2xl text-[0.9rem] leading-relaxed text-ivory/75">{open.body}</p>}
              {open.credit && (
                <p className="mt-3 text-[0.7rem] text-ivory/45">
                  {dict.gallery.photoCredit}: {open.credit}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setOpen(null)}
            aria-label={dict.common.close}
            className="absolute right-4 top-4 rounded-full bg-ivory/15 p-2 text-ivory hover:bg-ivory/25"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}
