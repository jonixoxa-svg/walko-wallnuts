"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site";

export default function ContactForms({ locale, dict }: { locale: Locale; dict: Dict }) {
  const [contact, setContact] = useState({ name: "", email: "", phone: "", subject: "general", body: "" });
  const [visit, setVisit] = useState({ name: "", email: "", date: "", guests: "2", body: "" });
  const [state, setState] = useState<{ contact?: string; visit?: string }>({});
  const [busy, setBusy] = useState<"contact" | "visit" | null>(null);

  async function send(kind: "contact" | "visit") {
    setBusy(kind);
    const payload = kind === "contact" ? { ...contact, kind, locale } : { ...visit, kind, locale, subject: dict.contact.subjects.visit };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setState((s) => ({
        ...s,
        [kind]: res.ok ? "ok" : "error",
      }));
    } catch {
      setState((s) => ({ ...s, [kind]: "error" }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send("contact");
        }}
        className="card p-7"
      >
        <h2 className="font-display text-2xl">{dict.contact.formTitle}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">{dict.common.name}</span>
            <input required value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="field" />
          </label>
          <label>
            <span className="label">{dict.common.email}</span>
            <input
              required
              type="email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              className="field"
            />
          </label>
          <label>
            <span className="label">
              {dict.common.phone} <span className="text-ink/35">({dict.common.optional})</span>
            </span>
            <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="field" />
          </label>
          <label>
            <span className="label">{dict.contact.subject}</span>
            <select value={contact.subject} onChange={(e) => setContact({ ...contact, subject: e.target.value })} className="field">
              {Object.entries(dict.contact.subjects).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="label">{dict.common.message}</span>
            <textarea
              required
              rows={5}
              value={contact.body}
              onChange={(e) => setContact({ ...contact, body: e.target.value })}
              className="field resize-y"
            />
          </label>
        </div>
        <button type="submit" disabled={busy === "contact"} className="btn btn-primary mt-5 w-full">
          {busy === "contact" ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
          {dict.common.send}
        </button>
        {state.contact === "ok" && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-forest/8 px-3 py-2 text-[0.85rem] text-forest">
            <CheckCircle2 size={15} /> {dict.contact.success}
          </p>
        )}
        {state.contact === "error" && <p className="mt-4 text-[0.85rem] text-walnut">{dict.contact.failure}</p>}
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send("visit");
        }}
        className="card h-fit p-7"
      >
        <h2 className="font-display text-2xl">{dict.contact.visitTitle}</h2>
        <p className="mt-2 text-[0.88rem] text-ink/60">{dict.contact.visitLead}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">{dict.common.name}</span>
            <input required value={visit.name} onChange={(e) => setVisit({ ...visit, name: e.target.value })} className="field" />
          </label>
          <label>
            <span className="label">{dict.common.email}</span>
            <input
              required
              type="email"
              value={visit.email}
              onChange={(e) => setVisit({ ...visit, email: e.target.value })}
              className="field"
            />
          </label>
          <label>
            <span className="label">{dict.contact.visitDate}</span>
            <input type="date" value={visit.date} onChange={(e) => setVisit({ ...visit, date: e.target.value })} className="field" />
          </label>
          <label>
            <span className="label">{dict.contact.visitPeople}</span>
            <input
              type="number"
              min={1}
              max={20}
              value={visit.guests}
              onChange={(e) => setVisit({ ...visit, guests: e.target.value })}
              className="field"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="label">
              {dict.common.message} <span className="text-ink/35">({dict.common.optional})</span>
            </span>
            <textarea rows={3} value={visit.body} onChange={(e) => setVisit({ ...visit, body: e.target.value })} className="field resize-y" />
          </label>
        </div>
        <button type="submit" disabled={busy === "visit"} className="btn btn-outline mt-5 w-full">
          {busy === "visit" ? <Loader2 size={16} className="animate-spin" /> : null}
          {dict.contact.visitCta}
        </button>
        {state.visit === "ok" && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-forest/8 px-3 py-2 text-[0.85rem] text-forest">
            <CheckCircle2 size={15} /> {dict.contact.visitSuccess}
          </p>
        )}
        {state.visit === "error" && <p className="mt-4 text-[0.85rem] text-walnut">{dict.contact.failure}</p>}
      </form>
    </div>
  );
}
