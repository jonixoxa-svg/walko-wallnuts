import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";
import { getDict, resolveLocale } from "@/lib/i18n";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDict(locale);
  return { title: dict.meta.checkout.title, description: dict.meta.checkout.description, robots: { index: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);
  const dict = getDict(locale);
  const user = await getSessionUser();
  const demoMode = !process.env.STRIPE_SECRET_KEY;

  return (
    <div className="bg-beige/25 pb-24 pt-32">
      <div className="shell">
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)]">{dict.checkout.title}</h1>
        <p className="mt-3 max-w-xl text-[0.95rem] text-ink/60">{dict.checkout.lead}</p>
        <div className="mt-10">
          <Suspense fallback={<div className="skeleton h-64 rounded-xl" />}>
            <CheckoutClient
              locale={locale}
              dict={dict}
              demoMode={demoMode}
              user={user ? { name: user.name, email: user.email } : null}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
