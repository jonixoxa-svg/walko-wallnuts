"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, ExternalLink, Plus, X } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import type { Dict } from "@/lib/i18n";
import { formatDate, formatPrice, site, type Locale } from "@/lib/site";

interface TreeDetail {
  code: string;
  parcel: string;
  row: number;
  cultivar: string;
  planted: number;
  status: "available" | "reserved" | "sold";
  healthLabel: string;
  phaseLabel: string;
  estimateKg: number;
  lastInspection: string;
  photo: string;
  blur?: string;
  harvests: { year: number; kg: number }[];
  update?: { date: string; text: string; author: string };
}

export default function TreePanel({
  code,
  locale,
  dict,
  onClose,
}: {
  code: string | null;
  locale: Locale;
  dict: Dict;
  onClose: () => void;
}) {
  const [tree, setTree] = useState<TreeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { add, has } = useCart();

  useEffect(() => {
    if (!code) {
      setTree(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/tree/${code}?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setTree(data);
      })
      .catch(() => {
        if (!cancelled) setTree(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code, locale]);

  if (!code) return null;

  return (
    <div className="card animate-[fade-up_0.5s_cubic-bezier(0.22,1,0.36,1)] overflow-hidden">
      {loading && !tree && <div className="skeleton h-52 w-full" />}
      {tree && (
        <>
          <div className="relative aspect-[16/10]">
            <Image
              src={tree.photo}
              alt={tree.code}
              fill
              sizes="(max-width: 1024px) 92vw, 30vw"
              quality={68}
              placeholder={tree.blur ? "blur" : undefined}
              blurDataURL={tree.blur}
              className="object-cover"
            />
            <button
              onClick={onClose}
              aria-label={dict.common.close}
              className="absolute right-2 top-2 rounded-full bg-white/85 p-1.5 text-ink hover:bg-white"
            >
              <X size={15} />
            </button>
            <span className={`badge badge-${tree.status} absolute left-3 top-3`}>
              {tree.status === "available"
                ? dict.common.available
                : tree.status === "reserved"
                  ? dict.common.reserved
                  : dict.common.sold}
            </span>
          </div>

          <div className="p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl text-ink">{tree.code}</h2>
              {tree.status === "available" && (
                <p className="font-display text-xl text-forest">{formatPrice(site.totals.pricePerTree, locale)}</p>
              )}
            </div>
            <p className="mt-1 text-[0.82rem] text-ink/60">
              {tree.cultivar} · {dict.common.parcel} {tree.parcel} · {dict.common.row} {tree.row} ·{" "}
              {dict.common.planted} {tree.planted}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-[0.76rem]">
              <div className="rounded-lg bg-beige/45 px-3 py-2">
                <dt className="text-ink/50">{dict.common.health}</dt>
                <dd className="mt-0.5 font-medium">{tree.healthLabel}</dd>
              </div>
              <div className="rounded-lg bg-beige/45 px-3 py-2">
                <dt className="text-ink/50">{dict.common.phase}</dt>
                <dd className="mt-0.5 font-medium">{tree.phaseLabel}</dd>
              </div>
              <div className="rounded-lg bg-beige/45 px-3 py-2">
                <dt className="text-ink/50">
                  {dict.common.yield} ({dict.common.estimate})
                </dt>
                <dd className="mt-0.5 font-medium">
                  ≈ {tree.estimateKg} {dict.common.kg}
                </dd>
              </div>
              <div className="rounded-lg bg-beige/45 px-3 py-2">
                <dt className="text-ink/50">{dict.common.lastInspection}</dt>
                <dd className="mt-0.5 font-medium">{formatDate(tree.lastInspection, locale)}</dd>
              </div>
            </dl>

            {tree.update && (
              <p className="mt-4 border-l-2 border-gold/50 pl-3 text-[0.8rem] leading-relaxed text-ink/65">
                “{tree.update.text}”
                <span className="mt-1 block text-[0.72rem] text-ink/45">
                  {tree.update.author} · {formatDate(tree.update.date, locale)}
                </span>
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/${locale}/tree/${tree.code}`} className="btn btn-outline flex-1 !py-2.5 !text-[0.8rem]">
                <ExternalLink size={14} />
                {dict.orchard.openRecord}
              </Link>
              {tree.status === "available" && (
                <button
                  onClick={() =>
                    add({
                      code: tree.code,
                      parcel: tree.parcel,
                      cultivar: tree.cultivar,
                      price: site.totals.pricePerTree,
                      photo: tree.photo,
                    })
                  }
                  disabled={has(tree.code)}
                  className={`btn !py-2.5 !text-[0.8rem] ${has(tree.code) ? "btn-outline" : "btn-primary"}`}
                >
                  {has(tree.code) ? <Check size={14} /> : <Plus size={14} />}
                  {has(tree.code) ? dict.common.inCart : dict.common.addToCart}
                </button>
              )}
            </div>

            {tree.status === "sold" && <p className="mt-3 text-[0.76rem] text-ink/50">{dict.orchard.soldNotice}</p>}
            {tree.status === "reserved" && (
              <p className="mt-3 text-[0.76rem] text-ink/50">{dict.orchard.reservedNotice}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
