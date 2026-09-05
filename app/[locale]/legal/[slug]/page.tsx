import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/ui/Reveal";
import { getDict, resolveLocale } from "@/lib/i18n";
import { LOCALES, site } from "@/lib/site";

const SLUGS = ["terms", "privacy", "cookies", "refund", "ownership", "risk"] as const;
type Slug = (typeof SLUGS)[number];

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => SLUGS.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const dict = getDict(locale);
  if (!SLUGS.includes(slug as Slug)) return {};
  const page = dict.legal.pages[slug as Slug];
  return {
    title: page.title,
    description: page.intro,
    alternates: { canonical: `/${locale}/legal/${slug}` },
  };
}

export default async function LegalPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);
  if (!SLUGS.includes(slug as Slug)) notFound();
  const page = dict.legal.pages[slug as Slug];

  return (
    <div className="pb-24 pt-32">
      <div className="shell grid gap-12 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <p className="eyebrow">{dict.legal.title}</p>
          <nav className="mt-4 space-y-1">
            {SLUGS.map((item) => (
              <Link
                key={item}
                href={`/${locale}/legal/${item}`}
                aria-current={item === slug ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 text-[0.85rem] transition-colors ${
                  item === slug ? "bg-forest/8 font-medium text-forest" : "text-ink/60 hover:bg-beige/50"
                }`}
              >
                {dict.legal.pages[item].title}
              </Link>
            ))}
          </nav>
        </aside>

        <article className="max-w-2xl">
          <Reveal>
            <h1 className="font-display text-[clamp(1.9rem,3.8vw,2.9rem)] leading-[1.08]">{page.title}</h1>
            <p className="mt-4 text-[0.98rem] leading-relaxed text-ink/70">{page.intro}</p>
            <p className="mt-3 text-[0.75rem] text-ink/45">
              {dict.legal.lastUpdated}: {dict.legal.updatedDate}
            </p>
          </Reveal>

          <div className="mt-10 space-y-9">
            {page.sections.map((section, i) => (
              <Reveal key={section.h} delay={Math.min(i * 50, 200)}>
                <section>
                  <h2 className="font-display text-xl text-forest">{section.h}</h2>
                  {section.p.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="mt-3 text-[0.93rem] leading-[1.8] text-ink/70">
                      {paragraph}
                    </p>
                  ))}
                </section>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-gold/40 bg-gold/8 px-5 py-4 text-[0.82rem] leading-relaxed text-ink/70">
            {dict.legal.placeholderNote}
          </div>

          <address className="mt-8 text-[0.85rem] not-italic leading-relaxed text-ink/60">
            {site.legalName}
            <br />
            {site.contact.addressLines.slice(1).join(", ")}
            <br />
            {site.contact.email} · {site.contact.phone}
            <br />
            {site.contact.vat} · {site.contact.register}
          </address>
        </article>
      </div>
    </div>
  );
}
