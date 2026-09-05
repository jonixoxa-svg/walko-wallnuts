"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { site, type Locale } from "@/lib/site";

export default function LoginClient({ locale, dict }: { locale: Locale; dict: Dict }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(dict.auth.invalid);
        setBusy(false);
        return;
      }
      const target =
        data.role === "admin" ? `/${locale}/admin` : data.role === "worker" ? `/${locale}/field` : `/${locale}/dashboard`;
      router.push(target);
      router.refresh();
    } catch {
      setError(dict.common.error);
      setBusy(false);
    }
  }

  const demoAccounts = [
    { role: dict.auth.roleOwner, ...site.demoAccounts.owner },
    { role: dict.auth.roleWorker, ...site.demoAccounts.worker },
    { role: dict.auth.roleAdmin, ...site.demoAccounts.admin },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={submit} className="card p-7">
        <h1 className="font-display text-3xl">{dict.auth.loginTitle}</h1>
        <p className="mt-2 text-[0.9rem] text-ink/60">{dict.auth.loginLead}</p>

        <label className="mt-7 block">
          <span className="label">{dict.auth.emailLabel}</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </label>
        <label className="mt-4 block">
          <span className="label">{dict.auth.passwordLabel}</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </label>

        {error && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-walnut/10 px-3 py-2 text-[0.82rem] text-walnut-900">
            <AlertCircle size={15} /> {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          {busy ? dict.auth.submitting : dict.auth.submit}
        </button>

        <div className="mt-6 flex flex-wrap justify-between gap-2 text-[0.8rem] text-ink/55">
          <span>
            {dict.auth.forgot}{" "}
            <Link href={`/${locale}/contact`} className="link-underline text-forest">
              {dict.auth.forgotHint}
            </Link>
          </span>
          <span>
            {dict.auth.noAccount}{" "}
            <Link href={`/${locale}/orchard`} className="link-underline text-forest">
              {dict.auth.buyFirst}
            </Link>
          </span>
        </div>
      </form>

      <div className="card bg-forest-900 p-7 text-ivory">
        <h2 className="font-display text-2xl">{dict.auth.demoTitle}</h2>
        <p className="mt-2 text-[0.88rem] text-ivory/70">{dict.auth.demoLead}</p>
        <ul className="mt-6 space-y-3">
          {demoAccounts.map((account) => (
            <li key={account.email} className="rounded-xl border border-ivory/15 p-4">
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-gold-light">{account.role}</p>
              <p className="mt-2 font-mono text-[0.82rem] text-ivory/90">{account.email}</p>
              <p className="font-mono text-[0.82rem] text-ivory/60">{account.password}</p>
              <button
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
                className="link-underline mt-2 text-[0.78rem] text-gold-light"
              >
                {dict.common.open} →
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
