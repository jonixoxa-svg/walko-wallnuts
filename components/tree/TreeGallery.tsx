"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site";

export interface GalleryShot {
  src: string;
  blur?: string;
  year: number;
  season: "spring" | "summer" | "autumn" | "winter";
  credit?: string;
}

export default function TreeGallery({
  shots,
  code,
  dict,
  locale,
}: {
  shots: GalleryShot[];
  code: string;
  dict: Dict;
  locale: Locale;
}) {
  const [index, setIndex] = useState(shots.length - 1);
  const shot = shots[index];
  if (!shot) return null;

  const go = (delta: number) => setIndex((i) => (i + delta + shots.length) % shots.length);

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-beige">
        {shots.map((s, i) => (
          <Image
            key={s.src + i}
            src={s.src}
            alt={`${code} — ${dict.gallery.seasons[s.season]} ${s.year}`}
            fill
            sizes="(max-width: 1024px) 96vw, 62vw"
            quality={75}
            priority={i === shots.length - 1}
            placeholder={s.blur ? "blur" : undefined}
            blurDataURL={s.blur}
            className={`object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              i === index ? "scale-100 opacity-100" : "scale-105 opacity-0"
            }`}
          />
        ))}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-forest-900/75 to-transparent" />
        <p className="absolute bottom-4 left-4 text-[0.78rem] tracking-wide text-ivory">
          {dict.gallery.seasons[shot.season]} {shot.year}
        </p>

        {shots.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label={dict.common.back}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-ink transition-transform hover:scale-105"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              onClick={() => go(1)}
              aria-label={dict.common.continue}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-ink transition-transform hover:scale-105"
            >
              <ChevronRight size={17} />
            </button>
          </>
        )}
      </div>

      <div className="scrollbar-thin mt-3 flex gap-2 overflow-x-auto pb-1">
        {shots.map((s, i) => (
          <button
            key={s.src + i}
            onClick={() => setIndex(i)}
            aria-label={`${dict.gallery.seasons[s.season]} ${s.year}`}
            aria-current={i === index}
            className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition-all ${
              i === index ? "ring-2 ring-gold" : "opacity-70 hover:opacity-100"
            }`}
          >
            <Image src={s.src} alt="" fill sizes="96px" quality={60} className="object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-forest-900/70 py-0.5 text-[0.6rem] text-ivory">
              {s.year}
            </span>
          </button>
        ))}
      </div>
      {shot.credit && (
        <p className="mt-2 text-[0.68rem] text-ink/40">
          {dict.gallery.photoCredit}: {shot.credit}
        </p>
      )}
    </div>
  );
}
