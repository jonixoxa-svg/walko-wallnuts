import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import {
  Benefits,
  FaqTeaser,
  FinalCta,
  GalleryStrip,
  HowSteps,
  Intro,
  SectionHead,
  Seasons,
  Testimonials,
} from "@/components/home/Sections";
import Reveal from "@/components/ui/Reveal";
import TreeCard from "@/components/tree/TreeCard";
import { getDict } from "@/lib/i18n";
import { getStats, getTrees } from "@/lib/db";
import { resolveLocale } from "@/lib/i18n";
import { toCardData } from "@/lib/view";
import { baseUrl, site } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return {
    title: dict.meta.home.title,
    description: dict.meta.home.description,
    alternates: { canonical: `/${locale}`, languages: { en: "/en", de: "/de" } },
    openGraph: { title: dict.meta.home.title, description: dict.meta.home.description },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);
  const [stats, trees] = await Promise.all([getStats(), getTrees()]);

  const featured = trees
    .filter((t) => t.status === "available" && t.harvests.length > 2)
    .sort((a, b) => b.estimateKg - a.estimateKg)
    .slice(0, 60)
    .filter((_, i) => i % 10 === 0)
    .slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.brand,
    url: `${baseUrl()}/${locale}`,
    logo: `${baseUrl()}/favicon.svg`,
    email: site.contact.email,
    telephone: site.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.contact.addressLines[1],
      postalCode: site.contact.addressLines[2]?.split(" ")[0],
      addressLocality: site.contact.addressLines[2]?.split(" ").slice(1).join(" "),
      addressCountry: "AT",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero locale={locale} dict={dict} />
      <Stats dict={dict} locale={locale} stats={stats} />
      <Intro dict={dict} />
      <HowSteps dict={dict} locale={locale} />

      <section className="shell py-24 md:py-32">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            eyebrow={dict.home.available.eyebrow}
            title={dict.home.available.title}
            lead={dict.home.available.lead}
          />
          <Link href={`/${locale}/orchard`} className="btn btn-outline">
            {dict.home.available.cta}
            <ArrowRight size={16} />
          </Link>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((tree, i) => (
            <Reveal key={tree.code} delay={i * 70}>
              <TreeCard tree={toCardData(tree, dict)} locale={locale} dict={dict} />
            </Reveal>
          ))}
        </div>
      </section>

      <Benefits dict={dict} />
      <GalleryStrip dict={dict} locale={locale} />
      <Seasons dict={dict} />
      <Testimonials dict={dict} />
      <FaqTeaser dict={dict} locale={locale} />
      <FinalCta dict={dict} locale={locale} />
    </>
  );
}
