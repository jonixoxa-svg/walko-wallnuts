"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, QrCode, Search, Upload } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { formatDate, type Locale } from "@/lib/site";

interface LoadedTree {
  code: string;
  parcel: string;
  row: number;
  cultivar: string;
  planted: number;
  status: string;
  healthLabel: string;
  phaseLabel: string;
  estimateKg: number;
  lastInspection: string;
  photo: string;
}

const HEALTHS = ["excellent", "good", "fair", "attention"] as const;
const PHASES = ["dormant", "blooming", "growing", "ripening", "harvested"] as const;

export default function FieldClient({
  locale,
  dict,
  workerName,
  recent,
}: {
  locale: Locale;
  dict: Dict;
  workerName: string;
  recent: { code: string; date: string; text: string }[];
}) {
  const [code, setCode] = useState("");
  const [tree, setTree] = useState<LoadedTree | null>(null);
  const [health, setHealth] = useState<string>("good");
  const [phase, setPhase] = useState<string>("ripening");
  const [yieldKg, setYieldKg] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function load(target?: string) {
    const wanted = (target ?? code).trim().toUpperCase();
    const normalised = /^\d+$/.test(wanted) ? `WT-${wanted.padStart(4, "0")}` : wanted;
    if (!normalised) return;
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/tree/${normalised}?locale=${locale}`);
    if (!res.ok) {
      setTree(null);
      setError(dict.orchard.treeNotFound);
      return;
    }
    const data = (await res.json()) as LoadedTree;
    setTree(data);
    setCode(data.code);
  }

  /** Uses the browser BarcodeDetector where available; otherwise manual entry. */
  async function startScan() {
    setScanError(null);
    const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setScanError(dict.field.scanUnavailable);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setScanning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new Detector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          const hit = results.find((r) => /WT-\d{4}/i.test(r.rawValue));
          if (hit) {
            const match = hit.rawValue.match(/WT-\d{4}/i)![0].toUpperCase();
            stopScan();
            await load(match);
            return;
          }
        } catch {
          /* keep trying */
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      setScanError(dict.field.scanUnavailable);
      setScanning(false);
    }
  }

  function stopScan() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  useEffect(() => () => stopScan(), []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!tree) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("code", tree.code);
      form.set("health", health);
      form.set("phase", phase);
      form.set("note", note);
      if (yieldKg) form.set("yieldKg", yieldKg);
      if (file) form.set("photo", file);

      const res = await fetch("/api/field/update", { method: "POST", body: form });
      if (!res.ok) {
        setError(dict.common.error);
      } else {
        setSaved(true);
        setNote("");
        setYieldKg("");
        setFile(null);
        await load(tree.code);
      }
    } catch {
      setError(dict.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-5">
        <div className="card p-5">
          <p className="text-[0.78rem] text-ink/55">
            {dict.field.signedInAs} <span className="font-medium text-ink">{workerName}</span>
          </p>
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                placeholder="WT-0417"
                aria-label={dict.field.manual}
                className="field !py-2.5 !pl-9"
                inputMode="text"
              />
            </div>
            <button onClick={() => load()} className="btn btn-primary !py-2.5 !text-[0.82rem]">
              {dict.field.load}
            </button>
          </div>
          <button
            onClick={scanning ? stopScan : startScan}
            className="btn btn-outline mt-3 w-full !py-2.5 !text-[0.82rem]"
          >
            <QrCode size={15} />
            {scanning ? dict.common.cancel : dict.field.scan}
          </button>
          {scanning && (
            <div className="mt-3 overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} playsInline muted className="h-56 w-full object-cover" />
              <p className="bg-forest-900 px-3 py-2 text-[0.75rem] text-ivory/80">{dict.field.scanning}</p>
            </div>
          )}
          {scanError && <p className="mt-2 text-[0.78rem] text-walnut">{scanError}</p>}
          {error && <p className="mt-2 text-[0.78rem] text-walnut">{error}</p>}
        </div>

        {tree && (
          <div className="card overflow-hidden">
            <div className="relative aspect-[16/9]">
              <Image src={tree.photo} alt={tree.code} fill sizes="(max-width: 1024px) 92vw, 46vw" quality={65} className="object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-forest-900/80 px-3 py-1 font-display text-lg text-ivory">
                {tree.code}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-px bg-walnut/10 text-[0.78rem]">
              {[
                [dict.common.cultivar, tree.cultivar],
                [dict.common.parcel, `${tree.parcel} · ${dict.common.row} ${tree.row}`],
                [dict.common.health, tree.healthLabel],
                [dict.common.phase, tree.phaseLabel],
                [dict.common.lastInspection, formatDate(tree.lastInspection, locale)],
                [`${dict.common.yield} (${dict.common.estimate})`, `≈ ${tree.estimateKg} ${dict.common.kg}`],
              ].map(([label, value]) => (
                <div key={label} className="bg-white px-4 py-3">
                  <dt className="text-ink/45">{label}</dt>
                  <dd className="mt-0.5 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <div>
        <form onSubmit={submit} className="card p-5">
          <h2 className="font-display text-xl">{dict.field.inspection}</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">{dict.field.healthLabel}</span>
              <select value={health} onChange={(e) => setHealth(e.target.value)} className="field">
                {HEALTHS.map((h) => (
                  <option key={h} value={h}>
                    {dict.health[h]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">{dict.field.phaseLabel}</span>
              <select value={phase} onChange={(e) => setPhase(e.target.value)} className="field">
                {PHASES.map((p) => (
                  <option key={p} value={p}>
                    {dict.phases[p]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">{dict.field.yieldLabel}</span>
              <input
                value={yieldKg}
                onChange={(e) => setYieldKg(e.target.value)}
                inputMode="decimal"
                placeholder="0.0"
                className="field"
              />
            </label>
            <label>
              <span className="label">{dict.field.photoLabel}</span>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                  id="field-photo"
                />
                <label htmlFor="field-photo" className="btn btn-outline w-full cursor-pointer !py-2.5 !text-[0.8rem]">
                  {file ? <Upload size={14} /> : <Camera size={14} />}
                  {file ? file.name.slice(0, 18) : dict.field.photoLabel}
                </label>
              </div>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="label">{dict.field.noteLabel}</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="field resize-y" />
          </label>
          <p className="mt-2 text-[0.74rem] text-ink/50">{dict.field.photoHint}</p>

          <button type="submit" disabled={!tree || busy} className="btn btn-primary mt-5 w-full">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {busy ? dict.field.submitting : dict.field.submit}
          </button>

          {saved && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-forest/8 px-3 py-2 text-[0.82rem] text-forest">
              <CheckCircle2 size={15} /> {dict.field.success}
            </p>
          )}
        </form>

        <div className="card mt-5 p-5">
          <h2 className="font-display text-lg">{dict.field.recent}</h2>
          <ol className="mt-4 space-y-3">
            {recent.map((entry, i) => (
              <li key={entry.code + i} className="border-l-2 border-gold/60 pl-3">
                <p className="text-[0.72rem] uppercase tracking-wider text-ink/45">
                  {entry.code} · {formatDate(entry.date, locale)}
                </p>
                <p className="mt-0.5 text-[0.82rem] leading-relaxed text-ink/70">{entry.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
