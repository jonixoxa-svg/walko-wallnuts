import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import { SectionHead } from "@/components/home/Sections";
import { getDict, resolveLocale } from "@/lib/i18n";
import { pick } from "@/lib/photos";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return {
    title: dict.meta.about.title,
    description: dict.meta.about.description,
    alternates: { canonical: `/${locale}/about`, languages: { en: "/en/about", de: "/de/about" } },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);

  return (
    <div className="pb-24">
      <section className="relative isolate flex min-h-[62vh] items-end overflow-hidden pt-32">
        <Photo src={pick("landscape", 3).src} alt="" className="absolute inset-0 -z-10 h-full w-full" sizes="100vw" priority />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-900/92 via-forest-900/55 to-forest-900/70" />
        <div className="shell pb-16 text-ivory">
          <p className="eyebrow !text-gold-light">{dict.about.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.05]">{dict.about.title}</h1>
          <p className="mt-5 max-w-2xl text-[1rem] leading-relaxed text-ivory/80">{dict.about.lead}</p>
        </div>
      </section>

      <section className="shell grid gap-14 py-24 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <SectionHead title={dict.about.story.title} />
          {dict.about.story.body.map((paragraph) => (
            <p key={paragraph.slice(0, 20)} className="mt-5 text-[0.97rem] leading-[1.75] text-ink/70">
              {paragraph}
            </p>
          ))}
        </Reveal>
        <Reveal delay={100} className="space-y-4">
          <Photo src={pick("orchard", 5).src} alt="Orchard rows" className="aspect-[4/3] rounded-xl" sizes="(max-width: 1024px) 92vw, 46vw" />
          <div className="grid grid-cols-2 gap-4">
            <Photo src={pick("worker", 1).src} alt="Orchard team" className="aspect-square rounded-xl" sizes="23vw" />
            <Photo src={pick("detail", 0).src} alt="Walnut leaves" className="aspect-square rounded-xl" sizes="23vw" />
          </div>
        </Reveal>
      </section>

      <section className="bg-forest-900 py-24 text-ivory">
        <div className="shell grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <SectionHead title={dict.about.vision.title} tone="dark" />
          </Reveal>
          <Reveal delay={80}>
            {dict.about.vision.body.map((paragraph) => (
              <p key={paragraph.slice(0, 20)} className="mt-5 text-[0.97rem] leading-[1.75] text-ivory/75 first:mt-0">
                {paragraph}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="shell py-24">
        <Reveal>
          <SectionHead title={dict.about.methods.title} />
        </Reveal>
        <div className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {dict.about.methods.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 70}>
              <h3 className="font-display text-xl text-forest">{item.title}</h3>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-ink/65">{item.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-beige/40 py-24">
        <div className="shell grid gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionHead title={dict.about.terroir.title} />
            <dl className="mt-8 divide-y divide-walnut/12">
              {dict.about.terroir.items.map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-6 py-3">
                  <dt className="text-[0.8rem] uppercase tracking-[0.12em] text-ink/50">{item.label}</dt>
                  <dd className="text-right text-[0.92rem] text-ink/80">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal delay={100}>
            <SectionHead title={dict.about.sustainability.title} />
            {dict.about.sustainability.body.map((paragraph) => (
              <p key={paragraph.slice(0, 20)} className="mt-5 text-[0.95rem] leading-[1.75] text-ink/70">
                {paragraph}
              </p>
            ))}
            <Photo
              src={pick("aerial", 0).src}
              alt="Aerial view of the orchard"
              className="mt-8 aspect-[16/9] rounded-xl"
              sizes="(max-width: 1024px) 92vw, 46vw"
            />
          </Reveal>
        </div>
      </section>

      <section className="shell py-24">
        <Reveal>
          <SectionHead title={dict.about.team.title} />
        </Reveal>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {dict.about.team.members.map((member, i) => (
            <Reveal key={member.name} delay={i * 70}>
              <div className="card h-full p-6">
                <p className="font-display text-xl">{member.name}</p>
                <p className="mt-1 text-[0.76rem] uppercase tracking-[0.14em] text-gold">{member.role}</p>
                <p className="mt-3 text-[0.87rem] leading-relaxed text-ink/65">{member.bio}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="shell">
        <Reveal className="card overflow-hidden">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="p-8 md:p-10">
              <h2 className="font-display text-2xl">{dict.about.visit.title}</h2>
              <p className="mt-3 text-[0.93rem] leading-relaxed text-ink/65">{dict.about.visit.lead}</p>
              <p className="mt-5 flex items-start gap-2 text-[0.86rem] text-ink/70">
                <MapPin size={16} className="mt-0.5 shrink-0 text-forest" />
                {site.contact.addressLines.join(", ")} · {site.location.label}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/${locale}/contact`} className="btn btn-primary">
                  {dict.about.visit.cta}
                  <ArrowRight size={16} />
                </Link>
                <a
                  href={`https://www.google.com/maps?q=${site.location.mapsQuery}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-outline"
                >
                  {dict.contact.directions}
                </a>
              </div>
            </div>
            <div className="relative min-h-[260px]">
              <iframe
                title={dict.about.mapTitle}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${site.location.lng - 0.02}%2C${
                  site.location.lat - 0.012
                }%2C${site.location.lng + 0.02}%2C${site.location.lat + 0.012}&layer=mapnik&marker=${site.location.lat}%2C${
                  site.location.lng
                }`}
              />
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
