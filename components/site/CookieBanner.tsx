"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDict } from "@/lib/i18n";

const KEY = "walko.cookie-consent.v1";

/** GDPR-style consent: nothing optional is stored until the visitor chooses. */
export default function CookieBanner({ locale }: { locale: string }) {
  const dict = getDict(locale);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) {
        const timer = window.setTimeout(() => setVisible(true), 1400);
        return () => window.clearTimeout(timer);
      }
    } catch {
      /* storage blocked — do not nag */
    }
  }, []);

  function decide(choice: "all" | "necessary") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ choice, at: new Date().toISOString() }));
      document.cookie = `walko_consent=${choice}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={dict.cookies.title}
      className="fixed inset-x-3 bottom-3 z-[60] animate-[fade-up_0.6s_cubic-bezier(0.22,1,0.36,1)] md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md"
    >
      <div className="card p-5 md:p-6">
        <h2 className="font-display text-lg text-forest">{dict.cookies.title}</h2>
        <p className="mt-2 text-[0.85rem] leading-relaxed text-ink/70">{dict.cookies.body}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={() => decide("all")} className="btn btn-primary !py-2.5 !text-[0.8rem]">
            {dict.cookies.accept}
          </button>
          <button onClick={() => decide("necessary")} className="btn btn-outline !py-2.5 !text-[0.8rem]">
            {dict.cookies.necessary}
          </button>
          <Link
            href={`/${locale}/legal/cookies`}
            className="link-underline ml-auto text-[0.78rem] text-ink/60 hover:text-forest"
          >
            {dict.cookies.link}
          </Link>
        </div>
      </div>
    </div>
  );
}
