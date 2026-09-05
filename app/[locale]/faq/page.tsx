import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { getDict, resolveLocale } from "@/lib/i18n";
import { baseUrl } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return {
    title: dict.meta.faq.title,
    description: dict.meta.faq.description,
    alternates: { canonical: `/${locale}/faq`, languages: { en: "/en/faq", de: "/de/faq" } },
  };
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${baseUrl()}/${locale}/faq`,
    mainEntity: dict.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="pb-24 pt-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="shell max-w-3xl">
        <Reveal>
          <p className="eyebrow">{dict.faq.eyebrow}</p>
          <h1 className="mt-4 font-display text-[clamp(2.1rem,4.4vw,3.4rem)] leading-[1.06]">{dict.faq.title}</h1>
          <p className="mt-4 text-[0.98rem] leading-relaxed text-ink/65">{dict.faq.lead}</p>
        </Reveal>

        <div className="mt-12 divide-y divide-walnut/12">
          {dict.faq.items.map((item, i) => (
            <Reveal key={item.q} delay={Math.min(i * 40, 240)}>
              <details className="group py-5" open={i < 2}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                  <h2 className="font-display text-[1.15rem] leading-snug text-ink group-open:text-forest">{item.q}</h2>
                  <span className="mt-1 shrink-0 text-lg text-ink/35 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[0.93rem] leading-[1.75] text-ink/70">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14 card p-7 text-center">
          <p className="font-display text-2xl">{dict.faq.stillQuestions}</p>
          <Link href={`/${locale}/contact`} className="btn btn-primary mt-5">
            {dict.faq.contactCta}
            <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
