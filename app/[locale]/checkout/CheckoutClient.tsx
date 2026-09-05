"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Gift, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import type { Dict } from "@/lib/i18n";
import { formatPrice, type Locale } from "@/lib/site";

type Method = "card" | "applepay" | "googlepay" | "paypal" | "transfer";

export default function CheckoutClient({
  locale,
  dict,
  demoMode,
  user,
}: {
  locale: Locale;
  dict: Dict;
  demoMode: boolean;
  user: { name: string; email: string } | null;
}) {
  const { lines, total, clear, ready } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    zip: "",
    city: "",
    country: "",
  });
  const [gift, setGift] = useState(searchParams.get("gift") === "1");
  const [giftName, setGiftName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [method, setMethod] = useState<Method>("card");
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const codes = useMemo(() => lines.map((l) => l.code), [lines]);

  // Hold the selection while the buyer fills in the form.
  useEffect(() => {
    if (!ready || codes.length === 0) return;
    const payload = JSON.stringify({ items: codes });
    fetch("/api/reserve", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload }).catch(
      () => undefined
    );
    return () => {
      navigator.sendBeacon?.("/api/reserve/release", new Blob([payload], { type: "application/json" }));
    };
  }, [ready, codes]);

  useEffect(() => {
    if (ready && lines.length === 0 && !busy) router.replace(`/${locale}/cart`);
  }, [ready, lines.length, busy, router, locale]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) return setError(dict.checkout.errors.name);
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(form.email)) return setError(dict.checkout.errors.email);
    if (!terms) return setError(dict.checkout.errors.terms);

    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: codes,
          ...form,
          method,
          marketing,
          locale,
          gift: gift ? { name: giftName, message: giftMessage } : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error === "unavailable" ? dict.checkout.errors.unavailable : dict.common.error);
        setBusy(false);
        return;
      }
      clear();
      const query = data.password ? `?p=${encodeURIComponent(data.password)}` : "";
      router.push(`/${locale}/order/${data.orderId}${query}`);
    } catch {
      setError(dict.common.error);
      setBusy(false);
    }
  }

  const methods: { id: Method; label: string; note?: string }[] = [
    { id: "card", label: dict.checkout.methods.card },
    { id: "applepay", label: dict.checkout.methods.applePay },
    { id: "googlepay", label: dict.checkout.methods.googlePay },
    { id: "paypal", label: dict.checkout.methods.paypal },
    { id: "transfer", label: dict.checkout.methods.transfer },
  ];

  if (!ready) return <div className="skeleton h-64 rounded-xl" />;

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        {demoMode && (
          <div className="flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-walnut" />
            <div>
              <p className="text-[0.85rem] font-medium text-walnut-900">{dict.checkout.demoBadge}</p>
              <p className="mt-1 text-[0.82rem] leading-relaxed text-ink/65">{dict.checkout.demoNote}</p>
            </div>
          </div>
        )}

        <section className="card p-6">
          <h2 className="font-display text-xl">{dict.checkout.billing}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="label">{dict.common.name}</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="field"
                autoComplete="name"
              />
            </label>
            <label>
              <span className="label">{dict.common.email}</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field"
                autoComplete="email"
              />
            </label>
            <label>
              <span className="label">
                {dict.common.phone} <span className="text-ink/35">({dict.common.optional})</span>
              </span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="field"
                autoComplete="tel"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="label">{dict.common.address}</span>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="field"
                autoComplete="street-address"
              />
            </label>
            <label>
              <span className="label">{dict.common.zip}</span>
              <input
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                className="field"
                autoComplete="postal-code"
              />
            </label>
            <label>
              <span className="label">{dict.common.city}</span>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="field"
                autoComplete="address-level2"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="label">{dict.common.country}</span>
              <input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="field"
                autoComplete="country-name"
              />
            </label>
          </div>
          <p className="mt-4 text-[0.78rem] text-ink/55">{dict.checkout.accountHint}</p>
        </section>

        <section className="card p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} className="mt-1 h-4 w-4 accent-[#1e3a2b]" />
            <span>
              <span className="flex items-center gap-1.5 font-display text-lg">
                <Gift size={16} /> {dict.checkout.giftTitle}
              </span>
            </span>
          </label>
          {gift && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="label">{dict.checkout.giftName}</span>
                <input value={giftName} onChange={(e) => setGiftName(e.target.value)} className="field" />
              </label>
              <label>
                <span className="label">{dict.checkout.giftMessage}</span>
                <input value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} className="field" />
              </label>
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-display text-xl">{dict.checkout.payment}</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {methods.map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  method === m.id ? "border-forest bg-forest/6" : "border-walnut/15 hover:bg-beige/40"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={method === m.id}
                  onChange={() => setMethod(m.id)}
                  className="h-4 w-4 accent-[#1e3a2b]"
                />
                <span className="text-[0.88rem]">{m.label}</span>
              </label>
            ))}
          </div>
          <p className="mt-4 flex items-start gap-2 text-[0.78rem] leading-relaxed text-ink/55">
            <CreditCard size={14} className="mt-0.5 shrink-0" />
            {dict.checkout.cardNote}
          </p>
        </section>

        <section className="card space-y-3 p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1e3a2b]" />
            <span className="text-[0.85rem] leading-relaxed text-ink/75">
              {dict.checkout.terms}{" "}
              <Link href={`/${locale}/legal/ownership`} className="link-underline text-forest">
                ↗
              </Link>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#1e3a2b]"
            />
            <span className="text-[0.85rem] leading-relaxed text-ink/75">{dict.checkout.marketing}</span>
          </label>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="card p-6">
          <h2 className="font-display text-xl">{dict.checkout.summary}</h2>
          <ul className="mt-4 space-y-3">
            {lines.map((line) => (
              <li key={line.code} className="flex items-center gap-3">
                <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-md bg-beige">
                  {line.photo && <Image src={line.photo} alt="" fill sizes="56px" quality={55} className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1 text-[0.82rem]">
                  <p className="font-medium">{line.code}</p>
                  <p className="text-ink/55">{line.cultivar}</p>
                </div>
                <span className="text-[0.82rem]">{formatPrice(line.price, locale)}</span>
              </li>
            ))}
          </ul>
          <div className="hairline mt-5 flex items-baseline justify-between pt-4">
            <span className="text-[0.9rem]">{dict.common.total}</span>
            <span className="font-display text-3xl text-forest">{formatPrice(total, locale)}</span>
          </div>
          <p className="mt-1 text-[0.72rem] text-ink/45">{dict.cart.vatNote}</p>

          {error && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-walnut/10 px-3 py-2 text-[0.8rem] text-walnut-900">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary mt-5 w-full">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {busy ? dict.checkout.placing : dict.checkout.place}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.72rem] text-ink/45">
            <Lock size={12} /> {dict.checkout.securedBy}
          </p>
        </div>
      </aside>
    </form>
  );
}
