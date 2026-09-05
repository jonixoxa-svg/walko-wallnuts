"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, Plus, TreeDeciduous } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import type { Dict } from "@/lib/i18n";
import { formatPrice, site, type Locale } from "@/lib/site";

export interface TreeCardData {
  code: string;
  parcel: string;
  row: number;
  cultivar: string;
  planted: number;
  status: "available" | "reserved" | "sold";
  health: string;
  photo: string;
  blur?: string;
  estimateKg: number;
  lastYield?: number;
}

export default function TreeCard({
  tree,
  locale,
  dict,
  priority = false,
}: {
  tree: TreeCardData;
  locale: Locale;
  dict: Dict;
  priority?: boolean;
}) {
  const { add, has, lastAdded } = useCart();
  const inCart = has(tree.code);
  const justAdded = lastAdded === tree.code;
  const statusLabel =
    tree.status === "available" ? dict.common.available : tree.status === "reserved" ? dict.common.reserved : dict.common.sold;

  return (
    <article className="group card overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1">
      <Link href={`/${locale}/tree/${tree.code}`} className="relative block aspect-[4/3] overflow-hidden">
        <Image
          src={tree.photo}
          alt={`${dict.common.treeId} ${tree.code}`}
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
          quality={68}
          priority={priority}
          placeholder={tree.blur ? "blur" : undefined}
          blurDataURL={tree.blur}
          className="zoom-img object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-forest-900/70 to-transparent" />
        <span className={`badge badge-${tree.status} absolute left-3 top-3 backdrop-blur`}>{statusLabel}</span>
        <span className="absolute bottom-3 left-3 font-display text-lg text-ivory tracking-wide">{tree.code}</span>
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.92rem] font-medium text-ink">{tree.cultivar}</p>
            <p className="mt-1 text-[0.78rem] text-ink/55">
              {dict.common.parcel} {tree.parcel} · {dict.common.row} {tree.row} · {dict.common.planted} {tree.planted}
            </p>
          </div>
          <p className="shrink-0 font-display text-xl text-forest">{formatPrice(site.totals.pricePerTree, locale)}</p>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-[0.76rem]">
          <div className="rounded-lg bg-beige/45 px-3 py-2">
            <dt className="text-ink/50">{dict.common.health}</dt>
            <dd className="mt-0.5 font-medium text-ink/85">{tree.health}</dd>
          </div>
          <div className="rounded-lg bg-beige/45 px-3 py-2">
            <dt className="text-ink/50">
              {dict.common.yield} ({dict.common.estimate})
            </dt>
            <dd className="mt-0.5 font-medium text-ink/85">
              ≈ {tree.estimateKg} {dict.common.kg}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex items-center gap-2">
          <Link href={`/${locale}/tree/${tree.code}`} className="btn btn-outline flex-1 !py-2.5 !text-[0.8rem]">
            <TreeDeciduous size={15} />
            {dict.common.viewTree}
          </Link>
          {tree.status === "available" && (
            <button
              onClick={() =>
                add({ code: tree.code, parcel: tree.parcel, cultivar: tree.cultivar, price: site.totals.pricePerTree, photo: tree.photo })
              }
              disabled={inCart}
              className={`btn !py-2.5 !text-[0.8rem] ${inCart ? "btn-outline" : "btn-primary"} ${
                justAdded ? "scale-[1.04]" : ""
              }`}
              aria-label={`${dict.common.addToCart} ${tree.code}`}
            >
              {inCart ? <Check size={15} /> : <Plus size={15} />}
              {inCart ? dict.common.inCart : dict.common.addToCart}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
