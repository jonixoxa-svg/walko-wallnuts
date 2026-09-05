import Link from "next/link";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { site, type Locale } from "@/lib/site";
import Logo from "@/components/site/Logo";
import NewsletterForm from "@/components/site/NewsletterForm";

export default function Footer({ locale, dict }: { locale: Locale; dict: Dict }) {
  const explore = [
    { href: `/${locale}/orchard`, label: dict.nav.orchard },
    { href: `/${locale}/how-it-works`, label: dict.nav.howItWorks },
    { href: `/${locale}/gallery`, label: dict.nav.gallery },
    { href: `/${locale}/faq`, label: dict.nav.faq },
  ];
  const owners = [
    { href: `/${locale}/login`, label: dict.nav.login },
    { href: `/${locale}/dashboard`, label: dict.nav.dashboard },
    { href: `/${locale}/contact`, label: dict.contact.visitTitle },
  ];
  const company = [
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/contact`, label: dict.nav.contact },
    { href: `/${locale}/credits`, label: dict.footer.photoCredits },
  ];
  const legal = [
    { href: `/${locale}/legal/terms`, label: dict.legal.pages.terms.title },
    { href: `/${locale}/legal/privacy`, label: dict.legal.pages.privacy.title },
    { href: `/${locale}/legal/cookies`, label: dict.legal.pages.cookies.title },
    { href: `/${locale}/legal/refund`, label: dict.legal.pages.refund.title },
    { href: `/${locale}/legal/ownership`, label: dict.legal.pages.ownership.title },
    { href: `/${locale}/legal/risk`, label: dict.legal.pages.risk.title },
  ];

  return (
    <footer className="mt-24 bg-forest-900 text-ivory/85">
      <div className="shell grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2.5 text-ivory">
            <Logo />
            <span className="font-display text-xl uppercase tracking-[0.16em]">{site.brand}</span>
          </div>
          <p className="mt-5 max-w-sm text-[0.9rem] leading-relaxed text-ivory/70">{dict.footer.tagline}</p>
          <div className="mt-6 space-y-2 text-[0.85rem] text-ivory/70">
            <a href={`mailto:${site.contact.email}`} className="flex items-center gap-2 hover:text-gold-light">
              <Mail size={15} /> {site.contact.email}
            </a>
            <a href={`tel:${site.contact.phoneHref}`} className="flex items-center gap-2 hover:text-gold-light">
              <Phone size={15} /> {site.contact.phone}
            </a>
            <p className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              <span>{site.contact.addressLines.join(", ")}</span>
            </p>
          </div>
          <div className="mt-6 flex gap-3">
            {[
              { href: site.social.instagram, icon: Instagram, label: "Instagram" },
              { href: site.social.facebook, icon: Facebook, label: "Facebook" },
              { href: site.social.youtube, icon: Youtube, label: "YouTube" },
            ].map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-full border border-ivory/20 p-2 transition-colors hover:border-gold hover:text-gold-light"
              >
                <Icon size={16} strokeWidth={1.6} />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-5">
          {[
            { title: dict.footer.explore, items: explore },
            { title: dict.footer.owners, items: owners },
            { title: dict.footer.company, items: company },
            { title: dict.footer.legalTitle, items: legal.slice(0, 4) },
          ].map((group) => (
            <div key={group.title}>
              <h3 className="text-[0.7rem] uppercase tracking-[0.2em] text-gold-light/90">{group.title}</h3>
              <ul className="mt-4 space-y-2.5 text-[0.85rem] text-ivory/70">
                {group.items.map((item) => (
                  <li key={item.href + item.label}>
                    <Link href={item.href} className="link-underline hover:text-ivory">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3">
          <h3 className="text-[0.7rem] uppercase tracking-[0.2em] text-gold-light/90">{dict.footer.newsletter}</h3>
          <p className="mt-4 text-[0.85rem] text-ivory/70">{dict.contact.newsletterLead}</p>
          <NewsletterForm locale={locale} dict={dict} variant="dark" />
        </div>
      </div>

      <div className="border-t border-ivory/12">
        <div className="shell flex flex-col gap-3 py-6 text-[0.75rem] text-ivory/55 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.legalName}. {dict.footer.rights}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.slice(4).map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-ivory">
                {item.label}
              </Link>
            ))}
            <Link href={`/${locale}/legal/terms`} className="hover:text-ivory">
              {dict.footer.imprint}
            </Link>
          </div>
        </div>
        <div className="shell pb-6 text-[0.7rem] text-ivory/35">{dict.footer.demoNotice}</div>
      </div>
    </footer>
  );
}
