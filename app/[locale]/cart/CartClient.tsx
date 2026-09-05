"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trash2, TreeDeciduous } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import type { Dict } from "@/lib/i18n";
import { formatPrice, type Locale } from "@/lib/site";

export default function CartClient({ locale, dict }: { locale: Locale; dict: Dict }) {
  const { lines, remove, total, ready } = useCart();

  if (!ready) {
    return <div className="skeleton h-40 rounded-xl" />;
  }

  if (lines.length === 0) {
    return (
      <div className="card flex flex-col items-center px-8 py-16 text-center">
        <TreeDeciduous size={30} className="text-forest/50" />
        <p className="mt-4 text-[0.95rem] text-ink/65">{dict.cart.empty}</p>
        <Link href={`/${locale}/orchard`} className="btn btn-primary mt-6">
          {dict.cart.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <ul className="space-y-3">
        {lines.map((line) => (
          <li key={line.code} className="card flex items-center gap-4 p-3 sm:p-4">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-beige sm:h-24 sm:w-32">
              {line.photo && (
                <Image src={line.photo} alt={line.code} fill sizes="128px" quality={60} className="object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/${locale}/tree/${line.code}`} className="font-display text-xl text-ink hover:text-forest">
                {line.code}
              </Link>
              <p className="mt-0.5 text-[0.82rem] text-ink/55">
                {line.cultivar} · {dict.common.parcel} {line.parcel}
              </p>
            </div>
            <p className="font-display text-lg text-forest">{formatPrice(line.price, locale)}</p>
            <button
              onClick={() => remove(line.code)}
              aria-label={`${dict.common.removeFromCart} ${line.code}`}
              className="rounded-full p-2 text-ink/45 transition-colors hover:bg-walnut/8 hover:text-walnut"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        <li>
          <Link href={`/${locale}/orchard`} className="link-underline text-[0.85rem] text-forest">
            + {dict.cart.addMore}
          </Link>
        </li>
      </ul>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="card p-6">
          <h2 className="font-display text-xl">{dict.checkout.summary}</h2>
          <dl className="mt-5 space-y-2 text-[0.88rem]">
            <div className="flex justify-between">
              <dt className="text-ink/60">
                {lines.length} {lines.length === 1 ? dict.common.tree : dict.common.trees}
              </dt>
              <dd>{formatPrice(total, locale)}</dd>
            </div>
            <div className="hairline pt-3 flex justify-between text-[1rem] font-medium">
              <dt>{dict.cart.subtotal}</dt>
              <dd className="font-display text-2xl text-forest">{formatPrice(total, locale)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[0.72rem] text-ink/45">{dict.cart.vatNote}</p>
          <Link href={`/${locale}/checkout`} className="btn btn-primary mt-6 w-full">
            {dict.cart.checkout}
            <ArrowRight size={16} />
          </Link>
          <p className="mt-3 text-[0.75rem] leading-relaxed text-ink/50">{dict.cart.lead}</p>
        </div>
      </aside>
    </div>
  );
}
