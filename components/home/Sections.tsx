import Link from "next/link";
import { ArrowRight, Quote, Sprout, Leaf, Sun, Snowflake, Check } from "lucide-react";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site";
import { pick } from "@/lib/photos";

export function SectionHead({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "light",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
}) {
  return (
    <div className={`${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      {eyebrow && <p className={`eyebrow ${tone === "dark" ? "!text-gold-light" : ""}`}>{eyebrow}</p>}
      <h2
        className={`mt-4 font-display text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.08] ${
          tone === "dark" ? "text-ivory" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {lead && (
        <p className={`mt-4 text-[0.98rem] leading-relaxed ${tone === "dark" ? "text-ivory/70" : "text-ink/65"}`}>
          {lead}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ intro */

export function Intro({ dict }: { dict: Dict }) {
  return (
    <section className="shell py-24 md:py-32">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <SectionHead eyebrow={dict.home.intro.eyebrow} title={dict.home.intro.title} />
          {dict.home.intro.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="mt-5 text-[0.98rem] leading-[1.75] text-ink/70">
              {paragraph}
            </p>
          ))}
          <ul className="mt-9 grid gap-5 sm:grid-cols-2">
            {dict.home.intro.points.map((point) => (
              <li key={point.title} className="border-l-2 border-gold/60 pl-4">
                <p className="font-display text-lg text-forest">{point.title}</p>
                <p className="mt-1 text-[0.85rem] leading-relaxed text-ink/60">{point.text}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120} className="grid grid-cols-2 gap-4">
          <Photo
            src={pick("orchard", 1).src}
            alt="Rows of walnut trees in summer"
            className="col-span-2 aspect-[16/10] rounded-xl"
            sizes="(max-width: 1024px) 92vw, 46vw"
          />
          <Photo
            src={pick("fruit", 2).src}
            alt="Green walnuts on the branch"
            className="aspect-[4/5] rounded-xl"
            sizes="(max-width: 1024px) 45vw, 23vw"
          />
          <Photo
            src={pick("worker", 0).src}
            alt="Soil in the hands of the orchard team"
            className="aspect-[4/5] rounded-xl"
            sizes="(max-width: 1024px) 45vw, 23vw"
          />
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- how */

export function HowSteps({ dict, locale }: { dict: Dict; locale: Locale }) {
  return (
    <section className="relative overflow-hidden bg-forest-900 py-24 text-ivory md:py-32">
      <div className="absolute inset-0 opacity-[0.16]">
        <Photo src={pick("aerial", 0).src} alt="" className="h-full w-full" sizes="100vw" />
      </div>
      <div className="shell relative">
        <SectionHead eyebrow={dict.home.how.eyebrow} title={dict.home.how.title} lead={dict.home.how.lead} tone="dark" />
        <ol className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {dict.home.how.steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 90}>
              <div className="flex h-full flex-col border-t border-ivory/20 pt-6">
                <span className="font-display text-4xl text-gold-light/80">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 font-display text-xl text-ivory">{step.title}</h3>
                <p className="mt-3 text-[0.88rem] leading-relaxed text-ivory/65">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        <Reveal delay={160}>
          <Link href={`/${locale}/how-it-works`} className="btn btn-ghost mt-12">
            {dict.home.how.cta}
            <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- benefits */

export function Benefits({ dict }: { dict: Dict }) {
  return (
    <section className="shell py-24 md:py-32">
      <Reveal>
        <SectionHead eyebrow={dict.home.benefits.eyebrow} title={dict.home.benefits.title} />
      </Reveal>
      <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {dict.home.benefits.items.map((item, i) => (
          <Reveal key={item.title} delay={i * 70}>
            <div className="flex gap-4">
              <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest/8 text-forest">
                <Check size={16} strokeWidth={2} />
              </span>
              <div>
                <h3 className="font-display text-xl text-ink">{item.title}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-ink/65">{item.text}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={120}>
        <p className="mt-14 max-w-3xl border-l-2 border-walnut/25 pl-5 text-[0.84rem] leading-relaxed text-ink/55">
          {dict.home.benefits.disclaimer}
        </p>
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------- seasons */

const SEASON_ICONS = [Snowflake, Sprout, Sun, Leaf];
const SEASON_THEMES = ["winter", "spring", "fruit", "harvest"];

export function Seasons({ dict }: { dict: Dict }) {
  return (
    <section className="bg-beige/40 py-24 md:py-32">
      <div className="shell">
        <Reveal>
          <SectionHead
            eyebrow={dict.home.seasons.eyebrow}
            title={dict.home.seasons.title}
            lead={dict.home.seasons.lead}
            align="center"
          />
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {dict.home.seasons.items.map((item, i) => {
            const Icon = SEASON_ICONS[i] ?? Leaf;
            return (
              <Reveal key={item.season} delay={i * 80}>
                <article className="group card h-full overflow-hidden">
                  <Photo
                    src={pick(SEASON_THEMES[i] ?? "orchard", i + 3).src}
                    alt={item.title}
                    className="aspect-[5/3]"
                    imgClassName="zoom-img"
                    sizes="(max-width: 768px) 92vw, (max-width: 1280px) 45vw, 23vw"
                  />
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-forest">
                      <Icon size={16} strokeWidth={1.7} />
                      <span className="text-[0.7rem] uppercase tracking-[0.18em]">{item.season}</span>
                    </div>
                    <h3 className="mt-3 font-display text-xl text-ink">{item.title}</h3>
                    <p className="mt-1 text-[0.72rem] uppercase tracking-[0.14em] text-ink/45">{item.months}</p>
                    <p className="mt-3 text-[0.87rem] leading-relaxed text-ink/65">{item.text}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- testimonials */

export function Testimonials({ dict }: { dict: Dict }) {
  return (
    <section className="shell py-24 md:py-32">
      <Reveal>
        <SectionHead eyebrow={dict.home.testimonials.eyebrow} title={dict.home.testimonials.title} align="center" />
      </Reveal>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {dict.home.testimonials.items.map((item, i) => (
          <Reveal key={item.name} delay={i * 90}>
            <figure className="card flex h-full flex-col p-7">
              <Quote size={22} className="text-gold" strokeWidth={1.4} />
              <blockquote className="mt-5 flex-1 font-display text-[1.15rem] leading-[1.55] text-ink/85">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-6 border-t border-walnut/12 pt-4 text-[0.82rem]">
                <span className="font-medium text-ink">{item.name}</span>
                <span className="block text-ink/50">
                  {item.place} · {item.trees}
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- gallery strip */

export function GalleryStrip({ dict, locale }: { dict: Dict; locale: Locale }) {
  const shots = [
    { src: pick("harvest", 1).src, alt: "Harvest on the drying floor" },
    { src: pick("spring", 2).src, alt: "Walnut blossom in spring" },
    { src: pick("orchard", 4).src, alt: "Orchard rows" },
    { src: pick("nuts", 0).src, alt: "Walnut canopy in autumn" },
    { src: pick("worker", 3).src, alt: "The orchard team at work" },
    { src: pick("landscape", 2).src, alt: "The valley around the estate" },
  ];
  return (
    <section className="py-24 md:py-32">
      <div className="shell">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow={dict.home.gallery.eyebrow} title={dict.home.gallery.title} lead={dict.home.gallery.lead} />
          <Link href={`/${locale}/gallery`} className="btn btn-outline">
            {dict.home.gallery.cta}
            <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
      <div className="scrollbar-thin mt-12 flex snap-x gap-4 overflow-x-auto px-5 pb-4 md:px-8">
        {shots.map((shot, i) => (
          <Reveal key={shot.src + i} delay={i * 60} className="shrink-0 snap-start">
            <Link
              href={`/${locale}/gallery`}
              className="group block w-[78vw] overflow-hidden rounded-xl sm:w-[46vw] lg:w-[30vw]"
            >
              <Photo
                src={shot.src}
                alt={shot.alt}
                className="aspect-[4/3]"
                imgClassName="zoom-img"
                sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 30vw"
              />
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- faq teaser */

export function FaqTeaser({ dict, locale }: { dict: Dict; locale: Locale }) {
  return (
    <section className="shell py-24 md:py-28">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <SectionHead eyebrow={dict.home.faq.eyebrow} title={dict.home.faq.title} />
          <Link href={`/${locale}/faq`} className="btn btn-outline mt-8">
            {dict.home.faq.cta}
            <ArrowRight size={16} />
          </Link>
        </Reveal>
        <Reveal delay={100}>
          <dl className="divide-y divide-walnut/12">
            {dict.faq.items.slice(0, 5).map((item) => (
              <div key={item.q} className="py-5">
                <dt className="font-display text-lg text-ink">{item.q}</dt>
                <dd className="mt-2 text-[0.9rem] leading-relaxed text-ink/65">{item.a}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- final call */

export function FinalCta({ dict, locale }: { dict: Dict; locale: Locale }) {
  return (
    <section className="relative isolate overflow-hidden">
      <Photo src={pick("landscape", 4).src} alt="" className="absolute inset-0 -z-10 h-full w-full" sizes="100vw" />
      <div className="absolute inset-0 -z-10 bg-forest-900/78" />
      <div className="shell py-28 text-center text-ivory md:py-36">
        <Reveal>
          <h2 className="mx-auto max-w-3xl font-display text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.08]">
            {dict.home.cta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[0.98rem] leading-relaxed text-ivory/75">{dict.home.cta.lead}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href={`/${locale}/orchard`} className="btn btn-gold">
              {dict.home.cta.primary}
              <ArrowRight size={17} />
            </Link>
            <Link href={`/${locale}/contact`} className="btn btn-ghost">
              {dict.home.cta.secondary}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
