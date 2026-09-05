import type { Metadata } from "next";
import GalleryClient, { type GalleryItem } from "./GalleryClient";
import Reveal from "@/components/ui/Reveal";
import Photo from "@/components/ui/Photo";
import { getDict, resolveLocale } from "@/lib/i18n";
import { getDb } from "@/lib/db";
import { credit, photos } from "@/lib/photos";
import { formatDate } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return {
    title: dict.meta.gallery.title,
    description: dict.meta.gallery.description,
    alternates: { canonical: `/${locale}/gallery`, languages: { en: "/en/gallery", de: "/de/gallery" } },
  };
}

const SEASON_BY_THEME: Record<string, GalleryItem["season"]> = {
  spring: "spring",
  fruit: "summer",
  tree: "summer",
  orchard: "summer",
  aerial: "summer",
  harvest: "autumn",
  nuts: "autumn",
  autumn: "autumn",
  winter: "winter",
  care: "winter",
  worker: "spring",
  landscape: "autumn",
  detail: "summer",
  hero: "summer",
};

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);
  const db = await getDb();

  const journalItems: GalleryItem[] = db.journal.map((entry) => ({
    id: entry.id,
    src: entry.photo,
    blur: credit(entry.photo)?.blur,
    year: entry.year,
    season: entry.season,
    parcel: entry.parcel,
    date: entry.date,
    title: entry[locale].title,
    body: entry[locale].body,
    credit: credit(entry.photo) ? `${credit(entry.photo)!.credit} (${credit(entry.photo)!.license})` : undefined,
  }));

  const parcels = ["A", "B", "C", "D", "E", "F"];
  const photoItems: GalleryItem[] = photos.map((photo, i) => {
    const season = SEASON_BY_THEME[photo.theme] ?? "summer";
    const year = 2024 + (i % 3);
    return {
      id: photo.name,
      src: photo.src,
      blur: photo.blur,
      year,
      season,
      parcel: parcels[i % parcels.length],
      date: `${year}-${season === "winter" ? "01" : season === "spring" ? "04" : season === "summer" ? "07" : "10"}-${String((i % 27) + 1).padStart(2, "0")}`,
      title:
        locale === "de"
          ? `${dict.gallery.seasons[season]} in Parzelle ${parcels[i % parcels.length]}`
          : `${dict.gallery.seasons[season]} in parcel ${parcels[i % parcels.length]}`,
      credit: `${photo.credit} (${photo.license})`,
    };
  });

  const items = [...journalItems, ...photoItems];
  const latest = db.journal.slice(0, 4);

  return (
    <div className="pb-24 pt-32">
      <div className="shell">
        <Reveal>
          <p className="eyebrow">{dict.gallery.eyebrow}</p>
          <h1 className="mt-4 max-w-2xl font-display text-[clamp(2.1rem,4.4vw,3.4rem)] leading-[1.06]">
            {dict.gallery.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-ink/65">{dict.gallery.lead}</p>
        </Reveal>

        <div className="mt-10">
          <GalleryClient items={items} locale={locale} dict={dict} />
        </div>

        <section className="mt-24">
          <Reveal>
            <p className="eyebrow">{dict.gallery.journalTitle}</p>
            <h2 className="mt-3 font-display text-[clamp(1.7rem,3vw,2.4rem)]">{dict.gallery.journalLead}</h2>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {latest.map((entry, i) => (
              <Reveal key={entry.id} delay={i * 80}>
                <article className="card h-full overflow-hidden">
                  <Photo
                    src={entry.photo}
                    alt={entry[locale].title}
                    className="aspect-[16/9]"
                    imgClassName="zoom-img"
                    sizes="(max-width: 768px) 92vw, 46vw"
                  />
                  <div className="p-6">
                    <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink/45">
                      {formatDate(entry.date, locale)} · {dict.gallery.seasons[entry.season]} {entry.year}
                    </p>
                    <h3 className="mt-2 font-display text-2xl">{entry[locale].title}</h3>
                    <p className="mt-3 text-[0.9rem] leading-relaxed text-ink/70">{entry[locale].body}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
