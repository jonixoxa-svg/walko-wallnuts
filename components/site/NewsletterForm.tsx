"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site";

export default function NewsletterForm({
  locale,
  dict,
  variant = "light",
}: {
  locale: Locale;
  dict: Dict;
  variant?: "light" | "dark";
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.includes("@")) return;
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  const dark = variant === "dark";

  if (state === "done") {
    return (
      <p className={`mt-5 flex items-center gap-2 text-[0.85rem] ${dark ? "text-gold-light" : "text-forest"}`}>
        <Check size={16} /> {dict.contact.newsletterSuccess}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5">
      <div className="flex items-center gap-2">
        <label htmlFor={`nl-${variant}`} className="sr-only">
          {dict.footer.newsletterPlaceholder}
        </label>
        <input
          id={`nl-${variant}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={dict.footer.newsletterPlaceholder}
          className={
            dark
              ? "w-full rounded-full border border-ivory/25 bg-transparent px-4 py-2.5 text-[0.85rem] text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none"
              : "field !rounded-full"
          }
        />
        <button
          type="submit"
          disabled={state === "sending"}
          aria-label={dict.contact.newsletterCta}
          className={`shrink-0 rounded-full p-2.5 transition-colors ${
            dark ? "bg-gold text-walnut-900 hover:bg-gold-light" : "bg-forest text-ivory hover:bg-forest-800"
          }`}
        >
          <ArrowRight size={16} />
        </button>
      </div>
      {state === "error" && (
        <p className={`mt-2 text-[0.78rem] ${dark ? "text-gold-light" : "text-walnut"}`}>{dict.common.error}</p>
      )}
      <p className={`mt-2 text-[0.7rem] ${dark ? "text-ivory/40" : "text-ink/50"}`}>{dict.contact.newsletterConsent}</p>
    </form>
  );
}
