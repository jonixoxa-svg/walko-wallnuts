import type { Metadata } from "next";
import CartClient from "./CartClient";
import { getDict, resolveLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return { title: dict.meta.cart.title, description: dict.meta.cart.description, robots: { index: false } };
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);

  return (
    <div className="bg-beige/25 pb-24 pt-32">
      <div className="shell">
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)]">{dict.cart.title}</h1>
        <p className="mt-3 max-w-xl text-[0.95rem] text-ink/60">{dict.cart.lead}</p>
        <div className="mt-10">
          <CartClient locale={locale} dict={dict} />
        </div>
      </div>
    </div>
  );
}
