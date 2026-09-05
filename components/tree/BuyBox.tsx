"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Gift, Plus, ShieldCheck } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import type { Dict } from "@/lib/i18n";
import { formatPrice, site, type Locale } from "@/lib/site";

export default function BuyBox({
  code,
  parcel,
  cultivar,
  photo,
  status,
  locale,
  dict,
}: {
  code: string;
  parcel: string;
  cultivar: string;
  photo: string;
  status: "available" | "reserved" | "sold";
  locale: Locale;
  dict: Dict;
}) {
  const { add, has } = useCart();
  const router = useRouter();
  const [gift, setGift] = useState(false);
  const inCart = has(code);

  function addTree() {
    add({ code, parcel, cultivar, price: site.totals.pricePerTree, photo });
  }

  if (status !== "available") {
    return (
      <div className="card p-6">
        <p className="badge badge-sold">{status === "sold" ? dict.common.sold : dict.common.reserved}</p>
        <p className="mt-4 text-[0.9rem] leading-relaxed text-ink/65">
          {status === "sold" ? dict.tree.ownedNotice : dict.orchard.reservedNotice}
        </p>
        <a href={`/${locale}/orchard`} className="btn btn-outline mt-5 w-full">
          {dict.tree.backToMap}
        </a>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.16em] text-ink/50">{dict.tree.buyBox.price}</p>
          <p className="mt-1 font-display text-4xl text-forest">{formatPrice(site.totals.pricePerTree, locale)}</p>
          <p className="text-[0.78rem] text-ink/50">{dict.tree.buyBox.oneTime}</p>
        </div>
        <span className="badge badge-available">{dict.common.available}</span>
      </div>

      <p className="mt-4 text-[0.85rem] leading-relaxed text-ink/65">{dict.tree.buyBox.includes}</p>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg bg-beige/45 p-3">
        <input
          type="checkbox"
          checked={gift}
          onChange={(e) => setGift(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#1e3a2b]"
        />
        <span>
          <span className="flex items-center gap-1.5 text-[0.85rem] font-medium text-ink">
            <Gift size={14} /> {dict.tree.buyBox.gift}
          </span>
          <span className="mt-0.5 block text-[0.76rem] text-ink/55">{dict.tree.buyBox.giftHint}</span>
        </span>
      </label>

      <div className="mt-5 space-y-2">
        <button
          onClick={() => {
            addTree();
            router.push(`/${locale}/checkout${gift ? "?gift=1" : ""}`);
          }}
          className="btn btn-primary w-full"
        >
          {dict.common.buyTree}
        </button>
        <button onClick={addTree} disabled={inCart} className="btn btn-outline w-full">
          {inCart ? <Check size={15} /> : <Plus size={15} />}
          {inCart ? dict.common.inCart : dict.common.addToCart}
        </button>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.72rem] text-ink/45">
        <ShieldCheck size={13} /> {dict.checkout.securedBy}
      </p>
    </div>
  );
}
