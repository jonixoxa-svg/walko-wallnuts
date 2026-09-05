"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Mail, Megaphone, Save, Search } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { formatDate, formatPrice, type Locale } from "@/lib/site";

export interface AdminTree {
  code: string;
  parcel: string;
  row: number;
  cultivar: string;
  planted: number;
  status: "available" | "reserved" | "sold";
  owner?: string;
  health: string;
  phase: string;
  lastYield?: number;
  lastInspection: string;
}

export interface AdminData {
  kpis: {
    revenue: number;
    orders: number;
    owners: number;
    available: number;
    reserved: number;
    sold: number;
    harvest: number;
  };
  trees: AdminTree[];
  orders: { id: string; date: string; name: string; email: string; codes: string[]; total: number; status: string; method: string }[];
  owners: { id: string; name: string; email: string; country: string; since: string; trees: number; lastLogin?: string }[];
  announcements: { id: string; date: string; title: string }[];
  journal: { id: string; date: string; title: string; parcel: string }[];
}

const TABS = ["overview", "trees", "orders", "owners", "announcements", "reports"] as const;
type Tab = (typeof TABS)[number];

const HEALTHS = ["excellent", "good", "fair", "attention"] as const;
const PHASES = ["dormant", "blooming", "growing", "ripening", "harvested"] as const;
const STATUSES = ["available", "reserved", "sold"] as const;

export default function AdminClient({ data, locale, dict }: { data: AdminData; locale: Locale; dict: Dict }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminTree | null>(null);
  const [form, setForm] = useState({ status: "", health: "", phase: "", yieldKg: "", note: "", photo: "" });
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const [announcement, setAnnouncement] = useState({ titleEn: "", titleDe: "", bodyEn: "", bodyDe: "", notify: false });
  const [mail, setMail] = useState({ subject: "", body: "" });

  const filteredTrees = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.trees.slice(0, 150);
    return data.trees
      .filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          t.parcel.toLowerCase() === q ||
          (t.owner ?? "").toLowerCase().includes(q) ||
          t.cultivar.toLowerCase().includes(q)
      )
      .slice(0, 150);
  }, [data.trees, query]);

  function openEditor(tree: AdminTree) {
    setEditing(tree);
    setForm({ status: tree.status, health: "", phase: "", yieldKg: "", note: "", photo: "" });
  }

  async function saveTree() {
    if (!editing) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/tree", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editing.code,
          status: form.status || undefined,
          health: form.health || undefined,
          phase: form.phase || undefined,
          yieldKg: form.yieldKg || undefined,
          note: form.note || undefined,
          photo: form.photo || undefined,
        }),
      });
      if (res.ok) {
        setFlash(`${dict.admin.saved}: ${editing.code}`);
        setEditing(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function publishAnnouncement() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announcement),
      });
      if (res.ok) {
        setFlash(dict.admin.announcement.published);
        setAnnouncement({ titleEn: "", titleDe: "", bodyEn: "", bodyDe: "", notify: false });
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendMail() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mail),
      });
      const result = await res.json();
      if (res.ok) {
        setFlash(`${dict.admin.email.sent} (${result.count})`);
        setMail({ subject: "", body: "" });
      }
    } finally {
      setBusy(false);
    }
  }

  const kpiCards = [
    { label: dict.admin.kpis.revenue, value: formatPrice(data.kpis.revenue, locale) },
    { label: dict.admin.kpis.orders, value: String(data.kpis.orders) },
    { label: dict.admin.kpis.owners, value: String(data.kpis.owners) },
    { label: dict.admin.kpis.sold, value: String(data.kpis.sold) },
    { label: dict.admin.kpis.available, value: String(data.kpis.available) },
    { label: dict.admin.kpis.reserved, value: String(data.kpis.reserved) },
    { label: dict.admin.kpis.harvest, value: `${data.kpis.harvest} ${dict.common.kg}` },
  ];

  const tabLabels: Record<Tab, string> = {
    overview: dict.admin.tabs.overview,
    trees: dict.admin.tabs.trees,
    orders: dict.admin.tabs.orders,
    owners: dict.admin.tabs.owners,
    announcements: dict.admin.tabs.announcements,
    reports: dict.admin.tabs.reports,
  };

  return (
    <div>
      {flash && (
        <p className="mb-6 rounded-lg bg-forest/8 px-4 py-2.5 text-[0.85rem] text-forest">{flash}</p>
      )}

      <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-walnut/12">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-current={tab === t}
            className={`whitespace-nowrap px-4 py-3 text-[0.85rem] transition-colors ${
              tab === t ? "border-b-2 border-forest font-medium text-forest" : "text-ink/55 hover:text-ink"
            }`}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "overview" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpiCards.map((kpi) => (
                <div key={kpi.label} className="card px-5 py-6">
                  <p className="text-[0.7rem] uppercase tracking-[0.16em] text-ink/45">{kpi.label}</p>
                  <p className="mt-2 font-display text-3xl text-forest">{kpi.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="card p-6">
                <h2 className="font-display text-xl">{dict.admin.tabs.orders}</h2>
                <ul className="mt-4 space-y-2 text-[0.84rem]">
                  {data.orders.slice(0, 6).map((order) => (
                    <li key={order.id} className="flex items-center justify-between gap-3 border-b border-walnut/8 pb-2">
                      <span>
                        <span className="font-medium">{order.id}</span>
                        <span className="block text-[0.76rem] text-ink/50">
                          {order.name} · {order.codes.length} {dict.common.trees}
                        </span>
                      </span>
                      <span>{formatPrice(order.total, locale)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-6">
                <h2 className="font-display text-xl">{dict.admin.export.title}</h2>
                <p className="mt-1 text-[0.8rem] text-ink/55">{dict.admin.export.hint}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { type: "trees", label: dict.admin.export.csvTrees },
                    { type: "orders", label: dict.admin.export.csvOrders },
                    { type: "owners", label: dict.admin.export.csvOwners },
                  ].map((item) => (
                    <a key={item.type} href={`/api/admin/export?type=${item.type}`} className="btn btn-outline !py-2 !text-[0.8rem]">
                      <Download size={14} />
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "trees" && (
          <div className="card overflow-hidden">
            <div className="border-b border-walnut/10 p-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={dict.admin.searchTrees}
                  className="field !py-2 !pl-9 !text-[0.84rem]"
                />
              </div>
            </div>
            <div className="scrollbar-thin max-h-[60vh] overflow-auto">
              <table className="w-full text-left text-[0.8rem]">
                <thead className="sticky top-0 bg-beige/80 text-[0.68rem] uppercase tracking-wider text-ink/55">
                  <tr>
                    <th className="px-4 py-2.5">{dict.admin.treeTable.code}</th>
                    <th className="px-4 py-2.5">{dict.admin.treeTable.parcel}</th>
                    <th className="px-4 py-2.5">{dict.admin.treeTable.cultivar}</th>
                    <th className="px-4 py-2.5">{dict.admin.treeTable.status}</th>
                    <th className="px-4 py-2.5">{dict.admin.treeTable.owner}</th>
                    <th className="px-4 py-2.5">{dict.admin.treeTable.health}</th>
                    <th className="px-4 py-2.5">{dict.admin.treeTable.lastYield}</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filteredTrees.map((tree) => (
                    <tr key={tree.code} className="border-t border-walnut/8 hover:bg-beige/30">
                      <td className="px-4 py-2 font-medium">{tree.code}</td>
                      <td className="px-4 py-2">
                        {tree.parcel}
                        {tree.row}
                      </td>
                      <td className="px-4 py-2">{tree.cultivar}</td>
                      <td className="px-4 py-2">
                        <span className={`badge badge-${tree.status}`}>
                          {tree.status === "available"
                            ? dict.common.available
                            : tree.status === "reserved"
                              ? dict.common.reserved
                              : dict.common.sold}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-ink/70">{tree.owner ?? "—"}</td>
                      <td className="px-4 py-2 text-ink/70">{tree.health}</td>
                      <td className="px-4 py-2 text-ink/70">{tree.lastYield ? `${tree.lastYield} kg` : "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => openEditor(tree)} className="link-underline text-forest">
                          {dict.admin.treeTable.actions}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="card scrollbar-thin max-h-[65vh] overflow-auto">
            <table className="w-full text-left text-[0.8rem]">
              <thead className="sticky top-0 bg-beige/80 text-[0.68rem] uppercase tracking-wider text-ink/55">
                <tr>
                  <th className="px-4 py-2.5">{dict.admin.ordersTable.id}</th>
                  <th className="px-4 py-2.5">{dict.admin.ordersTable.date}</th>
                  <th className="px-4 py-2.5">{dict.admin.ordersTable.customer}</th>
                  <th className="px-4 py-2.5">{dict.admin.ordersTable.trees}</th>
                  <th className="px-4 py-2.5">{dict.admin.ordersTable.total}</th>
                  <th className="px-4 py-2.5">{dict.admin.ordersTable.status}</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.slice(0, 200).map((order) => (
                  <tr key={order.id} className="border-t border-walnut/8">
                    <td className="px-4 py-2 font-medium">{order.id}</td>
                    <td className="px-4 py-2 text-ink/70">{formatDate(order.date, locale)}</td>
                    <td className="px-4 py-2">
                      {order.name}
                      <span className="block text-[0.72rem] text-ink/45">{order.email}</span>
                    </td>
                    <td className="px-4 py-2 text-ink/70">{order.codes.join(", ")}</td>
                    <td className="px-4 py-2">{formatPrice(order.total, locale)}</td>
                    <td className="px-4 py-2 text-ink/70">
                      {order.status} · {order.method}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "owners" && (
          <div className="card scrollbar-thin max-h-[65vh] overflow-auto">
            <table className="w-full text-left text-[0.8rem]">
              <thead className="sticky top-0 bg-beige/80 text-[0.68rem] uppercase tracking-wider text-ink/55">
                <tr>
                  <th className="px-4 py-2.5">{dict.admin.ownersTable.name}</th>
                  <th className="px-4 py-2.5">{dict.admin.ownersTable.email}</th>
                  <th className="px-4 py-2.5">{dict.admin.ownersTable.trees}</th>
                  <th className="px-4 py-2.5">{dict.admin.ownersTable.since}</th>
                  <th className="px-4 py-2.5">{dict.admin.ownersTable.lastLogin}</th>
                </tr>
              </thead>
              <tbody>
                {data.owners.slice(0, 200).map((owner) => (
                  <tr key={owner.id} className="border-t border-walnut/8">
                    <td className="px-4 py-2 font-medium">
                      {owner.name}
                      <span className="block text-[0.72rem] text-ink/45">{owner.country}</span>
                    </td>
                    <td className="px-4 py-2 text-ink/70">{owner.email}</td>
                    <td className="px-4 py-2">{owner.trees}</td>
                    <td className="px-4 py-2 text-ink/70">{formatDate(owner.since, locale)}</td>
                    <td className="px-4 py-2 text-ink/70">{owner.lastLogin ? formatDate(owner.lastLogin, locale) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "announcements" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h2 className="flex items-center gap-2 font-display text-xl">
                <Megaphone size={18} /> {dict.admin.announcement.title}
              </h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="label">{dict.admin.announcement.titleEn}</span>
                  <input
                    value={announcement.titleEn}
                    onChange={(e) => setAnnouncement({ ...announcement, titleEn: e.target.value })}
                    className="field"
                  />
                </label>
                <label className="block">
                  <span className="label">{dict.admin.announcement.bodyEn}</span>
                  <textarea
                    rows={3}
                    value={announcement.bodyEn}
                    onChange={(e) => setAnnouncement({ ...announcement, bodyEn: e.target.value })}
                    className="field resize-y"
                  />
                </label>
                <label className="block">
                  <span className="label">{dict.admin.announcement.titleDe}</span>
                  <input
                    value={announcement.titleDe}
                    onChange={(e) => setAnnouncement({ ...announcement, titleDe: e.target.value })}
                    className="field"
                  />
                </label>
                <label className="block">
                  <span className="label">{dict.admin.announcement.bodyDe}</span>
                  <textarea
                    rows={3}
                    value={announcement.bodyDe}
                    onChange={(e) => setAnnouncement({ ...announcement, bodyDe: e.target.value })}
                    className="field resize-y"
                  />
                </label>
                <label className="flex items-center gap-2 text-[0.82rem]">
                  <input
                    type="checkbox"
                    checked={announcement.notify}
                    onChange={(e) => setAnnouncement({ ...announcement, notify: e.target.checked })}
                    className="h-4 w-4 accent-[#1e3a2b]"
                  />
                  {dict.admin.announcement.all}
                </label>
                <button onClick={publishAnnouncement} disabled={busy} className="btn btn-primary w-full">
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />}
                  {dict.admin.announcement.publish}
                </button>
              </div>

              <ul className="mt-6 space-y-2 text-[0.82rem]">
                {data.announcements.slice(0, 5).map((item) => (
                  <li key={item.id} className="border-t border-walnut/8 pt-2">
                    <span className="text-[0.72rem] text-ink/45">{formatDate(item.date, locale)}</span>
                    <p className="text-ink/75">{item.title}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-6">
              <h2 className="flex items-center gap-2 font-display text-xl">
                <Mail size={18} /> {dict.admin.email.title}
              </h2>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="label">{dict.admin.email.subject}</span>
                  <input value={mail.subject} onChange={(e) => setMail({ ...mail, subject: e.target.value })} className="field" />
                </label>
                <label className="block">
                  <span className="label">{dict.admin.email.body}</span>
                  <textarea
                    rows={7}
                    value={mail.body}
                    onChange={(e) => setMail({ ...mail, body: e.target.value })}
                    className="field resize-y"
                  />
                </label>
                <button onClick={sendMail} disabled={busy} className="btn btn-outline w-full">
                  <Mail size={15} />
                  {dict.admin.email.send}
                </button>
                <p className="text-[0.74rem] text-ink/50">{dict.admin.email.note}</p>
              </div>
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div className="card p-6">
            <h2 className="font-display text-xl">{dict.gallery.journalTitle}</h2>
            <ul className="mt-4 space-y-2 text-[0.84rem]">
              {data.journal.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between border-b border-walnut/8 pb-2">
                  <span>
                    {entry.title}
                    <span className="block text-[0.74rem] text-ink/45">
                      {dict.common.parcel} {entry.parcel}
                    </span>
                  </span>
                  <span className="text-ink/55">{formatDate(entry.date, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest-900/45 p-4 sm:items-center">
          <div className="card w-full max-w-lg animate-[fade-up_0.4s_cubic-bezier(0.22,1,0.36,1)] p-6">
            <h2 className="font-display text-xl">
              {dict.admin.editTree} — {editing.code}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label>
                <span className="label">{dict.admin.setStatus}</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="field">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s === "available" ? dict.common.available : s === "reserved" ? dict.common.reserved : dict.common.sold}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">{dict.admin.setHealth}</span>
                <select value={form.health} onChange={(e) => setForm({ ...form, health: e.target.value })} className="field">
                  <option value="">—</option>
                  {HEALTHS.map((h) => (
                    <option key={h} value={h}>
                      {dict.health[h]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">{dict.admin.setPhase}</span>
                <select value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })} className="field">
                  <option value="">—</option>
                  {PHASES.map((p) => (
                    <option key={p} value={p}>
                      {dict.phases[p]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">{dict.admin.addYield}</span>
                <input
                  value={form.yieldKg}
                  onChange={(e) => setForm({ ...form, yieldKg: e.target.value })}
                  inputMode="decimal"
                  className="field"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="label">{dict.admin.addPhoto}</span>
                <input
                  value={form.photo}
                  onChange={(e) => setForm({ ...form, photo: e.target.value })}
                  placeholder="/uploads/WT-0001-1757000000000.webp"
                  className="field"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="label">{dict.admin.addNote}</span>
                <textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="field resize-y" />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={saveTree} disabled={busy} className="btn btn-primary flex-1">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {dict.admin.saveTree}
              </button>
              <button onClick={() => setEditing(null)} className="btn btn-outline">
                {dict.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
