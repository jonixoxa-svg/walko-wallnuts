"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Map as MapIcon, MoveDown } from "lucide-react";
import Leaves from "@/components/ui/Leaves";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site";
import { credit } from "@/lib/photos";

const HERO_SRC = "/photos/hero-208.webp";

export default function Hero({ locale, dict }: { locale: Locale; dict: Dict }) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const meta = credit(HERO_SRC);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setOffset(Math.min(window.scrollY, 900) * 0.25));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-forest-900">
      <div className="absolute inset-0 scale-[1.12]" style={{ transform: `translate3d(0, ${offset}px, 0) scale(1.12)` }}>
        <Image
          src={HERO_SRC}
          alt="The orchard from above: rows of walnut trees across the valley"
          fill
          priority
          quality={78}
          sizes="100vw"
          placeholder={meta?.blur ? "blur" : undefined}
          blurDataURL={meta?.blur}
          className="object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-forest-900/55 via-forest-900/18 to-forest-900/82" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_42%,rgba(16,26,20,0.42)_100%)]" />
      <Leaves count={9} />

      <div className="shell relative flex h-full flex-col justify-center pt-20 text-ivory">
        <p className="eyebrow !text-gold-light animate-[fade-in_1.2s_ease-out]">{dict.home.hero.eyebrow}</p>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.6rem,7vw,5.2rem)] leading-[1.02] tracking-[-0.02em]">
          <span className="block animate-[fade-up_1s_cubic-bezier(0.22,1,0.36,1)_both]">{dict.home.hero.title}</span>
          <span className="block animate-[fade-up_1s_cubic-bezier(0.22,1,0.36,1)_0.15s_both] text-gold-light">
            {dict.home.hero.titleAccent}
          </span>
        </h1>
        <p className="mt-7 max-w-xl text-[0.98rem] leading-relaxed text-ivory/85 animate-[fade-up_1s_cubic-bezier(0.22,1,0.36,1)_0.3s_both] md:text-[1.05rem]">
          {dict.home.hero.lead}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3 animate-[fade-up_1s_cubic-bezier(0.22,1,0.36,1)_0.45s_both]">
          <Link href={`/${locale}/orchard`} className="btn btn-gold">
            {dict.home.hero.ctaPrimary}
            <ArrowRight size={17} />
          </Link>
          <Link href={`/${locale}/gallery`} className="btn btn-ghost">
            <MapIcon size={16} />
            {dict.home.hero.ctaSecondary}
          </Link>
        </div>

        <p className="mt-6 text-[0.78rem] tracking-wide text-ivory/60 animate-[fade-in_1.4s_ease-out_0.7s_both]">
          {dict.home.hero.note}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-6 flex items-center justify-center">
        <span className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.28em] text-ivory/55">
          <MoveDown size={13} className="animate-bounce" />
          {dict.home.hero.scroll}
        </span>
      </div>
    </section>
  );
}
