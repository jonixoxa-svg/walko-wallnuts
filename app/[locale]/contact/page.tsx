import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import ContactForms from "./ContactForms";
import NewsletterForm from "@/components/site/NewsletterForm";
import Reveal from "@/components/ui/Reveal";
import { getDict, resolveLocale } from "@/lib/i18n";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return {
    title: dict.meta.contact.title,
    description: dict.meta.contact.description,
    alternates: { canonical: `/${locale}/contact`, languages: { en: "/en/contact", de: "/de/contact" } },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);

  const details = [
    { icon: Mail, label: dict.common.email, value: site.contact.email, href: `mailto:${site.contact.email}` },
    { icon: Phone, label: dict.common.phone, value: site.contact.phone, href: `tel:${site.contact.phoneHref}` },
    {
      icon: MessageCircle,
      label: dict.contact.whatsapp,
      value: site.contact.phone,
      href: `https://wa.me/${site.contact.whatsapp}`,
    },
    { icon: MapPin, label: dict.common.address, value: site.contact.addressLines.join(", ") },
    { icon: Clock, label: dict.contact.hours, value: dict.contact.hoursValue },
  ];

  return (
    <div className="bg-beige/25 pb-24 pt-32">
      <div className="shell">
        <Reveal>
          <p className="eyebrow">{dict.contact.eyebrow}</p>
          <h1 className="mt-4 max-w-2xl font-display text-[clamp(2.1rem,4.4vw,3.4rem)] leading-[1.06]">
            {dict.contact.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-ink/65">{dict.contact.lead}</p>
        </Reveal>

        <div className="mt-12">
          <ContactForms locale={locale} dict={dict} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Reveal className="card p-7">
            <h2 className="font-display text-2xl">{dict.contact.detailsTitle}</h2>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              {details.map((detail) => (
                <div key={detail.label} className="flex gap-3">
                  <detail.icon size={17} className="mt-0.5 shrink-0 text-forest" strokeWidth={1.6} />
                  <div>
                    <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-ink/45">{detail.label}</dt>
                    <dd className="mt-1 text-[0.9rem] text-ink/80">
                      {detail.href ? (
                        <a href={detail.href} className="link-underline hover:text-forest">
                          {detail.value}
                        </a>
                      ) : (
                        detail.value
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            <div className="mt-8 aspect-[16/9] overflow-hidden rounded-xl">
              <iframe
                title={dict.about.mapTitle}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${site.location.lng - 0.02}%2C${
                  site.location.lat - 0.012
                }%2C${site.location.lng + 0.02}%2C${site.location.lat + 0.012}&layer=mapnik&marker=${site.location.lat}%2C${
                  site.location.lng
                }`}
              />
            </div>
            <a
              href={`https://www.google.com/maps?q=${site.location.mapsQuery}`}
              target="_blank"
              rel="noreferrer noopener"
              className="link-underline mt-3 inline-block text-[0.85rem] text-forest"
            >
              {dict.contact.directions} ↗
            </a>
          </Reveal>

          <Reveal delay={80} className="card bg-forest-900 p-7 text-ivory">
            <h2 className="font-display text-2xl">{dict.contact.newsletterTitle}</h2>
            <p className="mt-2 text-[0.88rem] text-ivory/70">{dict.contact.newsletterLead}</p>
            <NewsletterForm locale={locale} dict={dict} variant="dark" />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
