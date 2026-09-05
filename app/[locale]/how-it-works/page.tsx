import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard, Map, MousePointerClick, Sprout } from "lucide-react";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import { SectionHead } from "@/components/home/Sections";
import { getDict, resolveLocale } from "@/lib/i18n";
import { pick } from "@/lib/photos";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return {
    title: dict.meta.howItWorks.title,
    description: dict.meta.howItWorks.description,
    alternates: { canonical: `/${locale}/how-it-works`, languages: { en: "/en/how-it-works", de: "/de/how-it-works" } },
  };
}

const ICONS = [Map, MousePointerClick, CreditCard, Sprout];
const THEMES = ["aerial", "tree", "nuts", "harvest"];

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);

  return (
    <div className="pb-24 pt-32">
      <div className="shell">
        <Reveal>
          <p className="eyebrow">{dict.howItWorks.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.1rem,4.6vw,3.5rem)] leading-[1.05]">
            {dict.howItWorks.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[1rem] leading-relaxed text-ink/65">{dict.howItWorks.lead}</p>
        </Reveal>

        <div className="mt-20 space-y-20">
          {dict.howItWorks.steps.map((step, i) => {
            const Icon = ICONS[i] ?? Sprout;
            const flip = i % 2 === 1;
            return (
              <Reveal key={step.title} delay={40}>
                <div className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
                  <Photo
                    src={pick(THEMES[i] ?? "orchard", i + 2).src}
                    alt={step.title}
                    className="aspect-[4/3] rounded-2xl"
                    sizes="(max-width: 1024px) 92vw, 46vw"
                  />
                  <div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest/10 text-forest">
                      <Icon size={19} strokeWidth={1.6} />
                    </span>
                    <p className="mt-5 font-display text-4xl text-gold">{String(i + 1).padStart(2, "0")}</p>
                    <h2 className="mt-2 font-display text-[clamp(1.6rem,2.6vw,2.2rem)]">{step.title}</h2>
                    <p className="mt-4 text-[0.97rem] leading-[1.75] text-ink/70">{step.text}</p>
                    <p className="mt-4 border-l-2 border-gold/50 pl-4 text-[0.88rem] leading-relaxed text-ink/55">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <section className="mt-28">
          <Reveal>
            <SectionHead title={dict.howItWorks.timelineTitle} align="center" />
          </Reveal>
          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dict.howItWorks.timeline.map((item, i) => (
              <Reveal as="li" key={item.when} delay={i * 60}>
                <div className="card h-full p-6">
                  <p className="text-[0.7rem] uppercase tracking-[0.18em] text-gold">{item.when}</p>
                  <p className="mt-3 text-[0.92rem] leading-relaxed text-ink/75">{item.what}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        <Reveal className="mt-20 text-center">
          <Link href={`/${locale}/orchard`} className="btn btn-primary">
            {dict.howItWorks.cta}
            <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
