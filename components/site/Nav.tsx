"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag, User, MapPin } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site";
import { site } from "@/lib/site";
import Logo from "@/components/site/Logo";

interface Props {
  locale: Locale;
  dict: Dict;
  user: { name: string; role: string } | null;
}

export default function Nav({ locale, dict, user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { count, lastAdded } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Only the home and about pages open with a dark hero behind the bar.
  const overHero = pathname === `/${locale}` || pathname === `/${locale}/about`;
  const solid = scrolled || open || !overHero;

  const links = [
    { href: `/${locale}/orchard`, label: dict.nav.orchard },
    { href: `/${locale}/how-it-works`, label: dict.nav.howItWorks },
    { href: `/${locale}/gallery`, label: dict.nav.gallery },
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/faq`, label: dict.nav.faq },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  const other: Locale = locale === "en" ? "de" : "en";
  const switchPath = pathname.replace(`/${locale}`, `/${other}`) || `/${other}`;

  const dashboardHref =
    user?.role === "admin" ? `/${locale}/admin` : user?.role === "worker" ? `/${locale}/field` : `/${locale}/dashboard`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solid ? "glass shadow-[0_10px_40px_-32px_rgba(16,26,20,0.8)]" : "bg-transparent"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-ivory"
      >
        {dict.nav.skipToContent}
      </a>
      <div className="shell flex h-[68px] items-center justify-between gap-4 md:h-[76px]">
        <Link href={`/${locale}`} className="flex items-center gap-2.5" aria-label={site.brand}>
          <Logo className={solid ? "text-forest" : "text-ivory"} />
          <span
            className={`font-display text-lg tracking-[0.14em] uppercase transition-colors ${
              solid ? "text-forest" : "text-ivory"
            }`}
          >
            {site.brandShort}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`link-underline text-[0.82rem] tracking-wide transition-colors ${
                  solid ? "text-ink/80 hover:text-forest" : "text-ivory/90 hover:text-ivory"
                } ${active ? "font-medium" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <div
            className={`hidden items-center gap-1 rounded-full border px-1 py-0.5 text-[0.7rem] tracking-wider sm:flex ${
              solid ? "border-walnut/20 text-ink/70" : "border-ivory/35 text-ivory/85"
            }`}
          >
            {(["en", "de"] as Locale[]).map((code) => (
              <button
                key={code}
                onClick={() => router.push(code === locale ? pathname : switchPath)}
                aria-current={code === locale ? "true" : undefined}
                className={`rounded-full px-2 py-1 uppercase transition-colors ${
                  code === locale
                    ? solid
                      ? "bg-forest text-ivory"
                      : "bg-ivory/90 text-forest"
                    : "hover:opacity-70"
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          <Link
            href={`/${locale}/cart`}
            className={`relative rounded-full p-2 transition-colors ${
              solid ? "text-ink hover:bg-forest/8" : "text-ivory hover:bg-ivory/15"
            }`}
            aria-label={dict.nav.cart}
          >
            <ShoppingBag size={19} strokeWidth={1.6} />
            {count > 0 && (
              <span
                className={`absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[0.62rem] font-semibold text-walnut-900 ${
                  lastAdded ? "animate-[pulse-ring_0.9s_ease-out]" : ""
                }`}
              >
                {count}
              </span>
            )}
          </Link>

          <Link
            href={user ? dashboardHref : `/${locale}/login`}
            className={`hidden items-center gap-2 rounded-full px-3.5 py-2 text-[0.78rem] transition-colors md:inline-flex ${
              solid
                ? "border border-forest/25 text-forest hover:bg-forest/8"
                : "border border-ivory/40 text-ivory hover:bg-ivory/15"
            }`}
          >
            <User size={15} strokeWidth={1.6} />
            {user ? user.name.split(" ")[0] : dict.nav.login}
          </Link>

          <Link href={`/${locale}/orchard`} className="btn btn-gold hidden !px-4 !py-2 text-[0.78rem] xl:inline-flex">
            <MapPin size={15} strokeWidth={1.8} />
            {dict.home.hero.ctaPrimary}
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            className={`rounded-full p-2 lg:hidden ${solid ? "text-ink" : "text-ivory"}`}
            aria-label={open ? dict.nav.close : dict.nav.menu}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-t border-walnut/10 bg-ivory transition-[max-height,opacity] duration-500 lg:hidden ${
          open ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="shell flex flex-col gap-1 py-4" aria-label="Mobile">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-2 py-2.5 text-[0.95rem] hover:bg-forest/6">
              {link.label}
            </Link>
          ))}
          <div className="hairline my-2" />
          <Link href={user ? dashboardHref : `/${locale}/login`} className="rounded-lg px-2 py-2.5 text-[0.95rem]">
            {user ? dict.nav.dashboard : dict.nav.login}
          </Link>
          <Link href={switchPath} className="rounded-lg px-2 py-2.5 text-[0.95rem]">
            {dict.nav.language}: {other.toUpperCase()}
          </Link>
          <Link href={`/${locale}/orchard`} className="btn btn-primary mt-3">
            {dict.home.hero.ctaPrimary}
          </Link>
        </nav>
      </div>
    </header>
  );
}
