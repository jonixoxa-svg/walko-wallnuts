"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, Crosshair, Search, Sparkles, X, LayoutGrid, Map as MapIcon } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import TreePanel from "@/components/map/TreePanel";
import type { Dict } from "@/lib/i18n";
import { formatPrice, site, type Locale } from "@/lib/site";

export interface MapTree {
  n: number;
  p: string;
  r: number;
  c: number;
  x: number;
  y: number;
  cv: number;
  s: 0 | 1 | 2; // available | reserved | sold
  pl: number;
  e: number;
}

const COLORS = {
  available: "#2f6b4a",
  reserved: "#c6a15b",
  sold: "#a09a8e",
  dim: "#cfc7b6",
};

export function codeOf(n: number) {
  return `WT-${String(n).padStart(4, "0")}`;
}

export default function OrchardMap({
  trees,
  cultivars,
  parcels,
  locale,
  dict,
}: {
  trees: MapTree[];
  cultivars: string[];
  parcels: string[];
  locale: Locale;
  dict: Dict;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef({ scale: 1, ox: 0, oy: 0, fitted: false });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const hoverRef = useRef<MapTree | null>(null);
  const rafRef = useRef(0);

  const [selected, setSelected] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ tree: MapTree; sx: number; sy: number } | null>(null);
  const [query, setQuery] = useState("");
  const [parcel, setParcel] = useState("all");
  const [cultivar, setCultivar] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"map" | "list">("map");
  const [picking, setPicking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { add, has, lines } = useCart();

  const bounds = useMemo(() => {
    const xs = trees.map((t) => t.x);
    const ys = trees.map((t) => t.y);
    return {
      minX: Math.min(...xs) - 14,
      maxX: Math.max(...xs) + 14,
      minY: Math.min(...ys) - 14,
      maxY: Math.max(...ys) + 14,
    };
  }, [trees]);

  const matches = useCallback(
    (t: MapTree) => {
      if (parcel !== "all" && t.p !== parcel) return false;
      if (cultivar !== "all" && cultivars[t.cv] !== cultivar) return false;
      if (status !== "all") {
        const s = t.s === 0 ? "available" : t.s === 1 ? "reserved" : "sold";
        if (s !== status) return false;
      }
      if (query.trim()) {
        const q = query.trim().toUpperCase().replace(/^WT-?/, "");
        if (!String(t.n).padStart(4, "0").includes(q)) return false;
      }
      return true;
    },
    [parcel, cultivar, status, query, cultivars]
  );

  const filtered = useMemo(() => trees.filter(matches), [trees, matches]);
  const filteredSet = useMemo(() => new Set(filtered.map((t) => t.n)), [filtered]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = wrap.clientWidth;
    const height = wrap.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const v = viewRef.current;
    if (!v.fitted && width > 0) {
      const worldW = bounds.maxX - bounds.minX;
      const worldH = bounds.maxY - bounds.minY;
      v.scale = Math.min(width / worldW, height / worldH) * 0.95;
      v.ox = width / 2 - ((bounds.minX + bounds.maxX) / 2) * v.scale;
      v.oy = height / 2 - ((bounds.minY + bounds.maxY) / 2) * v.scale;
      v.fitted = true;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // ground
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#f3efe4");
    grad.addColorStop(1, "#e7dfcd");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const toScreen = (x: number, y: number) => [x * v.scale + v.ox, y * v.scale + v.oy] as const;

    // parcel plates
    const groups = new Map<string, { minX: number; maxX: number; minY: number; maxY: number }>();
    for (const t of trees) {
      const g = groups.get(t.p);
      if (!g) groups.set(t.p, { minX: t.x, maxX: t.x, minY: t.y, maxY: t.y });
      else {
        g.minX = Math.min(g.minX, t.x);
        g.maxX = Math.max(g.maxX, t.x);
        g.minY = Math.min(g.minY, t.y);
        g.maxY = Math.max(g.maxY, t.y);
      }
    }
    groups.forEach((g, id) => {
      const [x1, y1] = toScreen(g.minX - 6, g.minY - 6);
      const [x2, y2] = toScreen(g.maxX + 6, g.maxY + 6);
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.strokeStyle = "rgba(107,74,47,0.16)";
      ctx.lineWidth = 1;
      const r = 10;
      ctx.beginPath();
      ctx.roundRect(x1, y1, x2 - x1, y2 - y1, r);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(107,74,47,0.5)";
      ctx.font = `500 ${Math.max(11, Math.min(20, 13 * v.scale))}px var(--font-sans), system-ui, sans-serif`;
      ctx.fillText(`${dict.common.parcel} ${id}`, x1 + 10, y1 + 20);
    });

    const radius = Math.max(1.4, Math.min(9, v.scale * 2.6));
    const selectedCodes = new Set(lines.map((l) => l.code));

    for (const t of trees) {
      const [sx, sy] = toScreen(t.x, t.y);
      if (sx < -20 || sy < -20 || sx > width + 20 || sy > height + 20) continue;
      const active = filteredSet.has(t.n);
      const code = codeOf(t.n);
      const chosen = selectedCodes.has(code);
      ctx.beginPath();
      ctx.arc(sx, sy, chosen ? radius * 1.35 : radius, 0, Math.PI * 2);
      ctx.fillStyle = !active
        ? COLORS.dim
        : t.s === 0
          ? COLORS.available
          : t.s === 1
            ? COLORS.reserved
            : COLORS.sold;
      ctx.globalAlpha = active ? 1 : 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (chosen || selected === code) {
        ctx.strokeStyle = "#c6a15b";
        ctx.lineWidth = Math.max(1.5, radius * 0.5);
        ctx.beginPath();
        ctx.arc(sx, sy, radius * 2.1, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const hovered = hoverRef.current;
    if (hovered) {
      const [sx, sy] = toScreen(hovered.x, hovered.y);
      ctx.strokeStyle = "#14261c";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx, sy, radius * 2.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [bounds, trees, filteredSet, lines, selected, dict.common.parcel]);

  const schedule = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  useEffect(() => {
    schedule();
    const onResize = () => {
      viewRef.current.fitted = false;
      schedule();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [schedule]);

  const pickAt = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const v = viewRef.current;
      const wx = (px - v.ox) / v.scale;
      const wy = (py - v.oy) / v.scale;
      let best: MapTree | null = null;
      let bestDist = Infinity;
      for (const t of trees) {
        if (!filteredSet.has(t.n)) continue;
        const d = (t.x - wx) ** 2 + (t.y - wy) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = t;
        }
      }
      const threshold = Math.max(6, 14 / v.scale) ** 2;
      return best && bestDist <= threshold ? best : null;
    },
    [trees, filteredSet]
  );

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    (event.target as HTMLCanvasElement).setPointerCapture(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      ox: viewRef.current.ox,
      oy: viewRef.current.oy,
    };
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (drag) {
      viewRef.current.ox = drag.ox + (event.clientX - drag.x);
      viewRef.current.oy = drag.oy + (event.clientY - drag.y);
      schedule();
      return;
    }
    const tree = pickAt(event.clientX, event.clientY);
    if (tree !== hoverRef.current) {
      hoverRef.current = tree;
      const rect = canvasRef.current!.getBoundingClientRect();
      setHoverInfo(tree ? { tree, sx: event.clientX - rect.left, sy: event.clientY - rect.top } : null);
      schedule();
    } else if (tree && hoverInfo) {
      const rect = canvasRef.current!.getBoundingClientRect();
      setHoverInfo({ tree, sx: event.clientX - rect.left, sy: event.clientY - rect.top });
    }
  }

  function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    const moved = Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y);
    if (moved < 5) {
      const tree = pickAt(event.clientX, event.clientY);
      if (tree) setSelected(codeOf(tree.n));
    }
  }

  /** Keyboard equivalent of drag/scroll: arrows pan, +/- zoom, Enter opens the centre tree. */
  function onKeyDown(event: React.KeyboardEvent<HTMLCanvasElement>) {
    const v = viewRef.current;
    const step = 60;
    const wrap = wrapRef.current;
    switch (event.key) {
      case "ArrowLeft":
        v.ox += step;
        break;
      case "ArrowRight":
        v.ox -= step;
        break;
      case "ArrowUp":
        v.oy += step;
        break;
      case "ArrowDown":
        v.oy -= step;
        break;
      case "+":
      case "=":
        zoomButtons(1.4);
        return;
      case "-":
      case "_":
        zoomButtons(1 / 1.4);
        return;
      case "Home":
        resetView();
        event.preventDefault();
        return;
      case "Enter":
      case " ": {
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const centre = pickAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
        if (centre) setSelected(codeOf(centre.n));
        event.preventDefault();
        return;
      }
      default:
        return;
    }
    event.preventDefault();
    schedule();
  }

  function onWheel(event: React.WheelEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    zoomAt(px, py, event.deltaY < 0 ? 1.15 : 1 / 1.15);
  }

  function zoomAt(px: number, py: number, factor: number) {
    const v = viewRef.current;
    const next = Math.min(14, Math.max(0.35, v.scale * factor));
    const k = next / v.scale;
    v.ox = px - (px - v.ox) * k;
    v.oy = py - (py - v.oy) * k;
    v.scale = next;
    schedule();
  }

  function zoomButtons(factor: number) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    zoomAt(wrap.clientWidth / 2, wrap.clientHeight / 2, factor);
  }

  function resetView() {
    viewRef.current.fitted = false;
    schedule();
  }

  function focusTree(n: number) {
    const wrap = wrapRef.current;
    const tree = trees.find((t) => t.n === n);
    if (!wrap || !tree) return;
    const v = viewRef.current;
    v.scale = 7;
    v.ox = wrap.clientWidth / 2 - tree.x * v.scale;
    v.oy = wrap.clientHeight / 2 - tree.y * v.scale;
    v.fitted = true;
    setSelected(codeOf(n));
    schedule();
  }

  async function pickBest() {
    setPicking(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/trees/pick-best?exclude=${lines.map((l) => l.code).join(",")}`);
      const data = await res.json();
      if (data?.code) {
        const tree = trees.find((t) => codeOf(t.n) === data.code);
        if (tree) {
          setParcel("all");
          setCultivar("all");
          setStatus("all");
          setQuery("");
          focusTree(tree.n);
          add({
            code: data.code,
            parcel: data.parcel,
            cultivar: data.cultivar,
            price: site.totals.pricePerTree,
            photo: data.photo,
          });
          setNotice(`${dict.orchard.pickedTitle}: ${data.code}`);
        }
      }
    } catch {
      setNotice(dict.common.error);
    } finally {
      setPicking(false);
    }
  }

  const searchGo = (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim().toUpperCase().replace(/^WT-?/, "");
    const n = Number(q);
    if (n > 0 && n <= trees.length) focusTree(n);
  };

  const statusOptions = [
    { value: "all", label: dict.orchard.filters.allStatus },
    { value: "available", label: dict.common.available },
    { value: "reserved", label: dict.common.reserved },
    { value: "sold", label: dict.common.sold },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
      <div>
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-walnut/10 p-3">
            <form onSubmit={searchGo} className="relative min-w-[190px] flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={dict.orchard.searchPlaceholder}
                aria-label={dict.orchard.searchPlaceholder}
                className="field !py-2 !pl-9 !text-[0.82rem]"
              />
            </form>
            <select
              value={parcel}
              onChange={(e) => setParcel(e.target.value)}
              aria-label={dict.orchard.filters.parcel}
              className="field !w-auto !py-2 !text-[0.8rem]"
            >
              <option value="all">{dict.orchard.filters.allParcels}</option>
              {parcels.map((p) => (
                <option key={p} value={p}>
                  {dict.common.parcel} {p}
                </option>
              ))}
            </select>
            <select
              value={cultivar}
              onChange={(e) => setCultivar(e.target.value)}
              aria-label={dict.orchard.filters.cultivar}
              className="field !w-auto !py-2 !text-[0.8rem]"
            >
              <option value="all">{dict.orchard.filters.allCultivars}</option>
              {cultivars.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label={dict.orchard.filters.status}
              className="field !w-auto !py-2 !text-[0.8rem]"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-1 rounded-full border border-walnut/15 p-0.5">
              <button
                onClick={() => setView("map")}
                className={`rounded-full px-2.5 py-1.5 text-[0.72rem] ${view === "map" ? "bg-forest text-ivory" : "text-ink/60"}`}
              >
                <MapIcon size={13} className="mr-1 inline" />
                {dict.orchard.mapView}
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-full px-2.5 py-1.5 text-[0.72rem] ${view === "list" ? "bg-forest text-ivory" : "text-ink/60"}`}
              >
                <LayoutGrid size={13} className="mr-1 inline" />
                {dict.orchard.listView}
              </button>
            </div>
          </div>

          {view === "map" ? (
            <div ref={wrapRef} className="relative h-[62vh] min-h-[420px] w-full touch-none">
              <canvas
                ref={canvasRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={() => {
                  hoverRef.current = null;
                  setHoverInfo(null);
                  schedule();
                }}
                onWheel={onWheel}
                onKeyDown={onKeyDown}
                tabIndex={0}
                className="h-full w-full cursor-grab rounded-b-2xl active:cursor-grabbing"
                role="application"
                aria-label={`${dict.orchard.title} — ${dict.orchard.keyboardHint}`}
              />

              {hoverInfo && (
                <div
                  className="pointer-events-none absolute z-10 rounded-lg bg-forest-900/92 px-3 py-2 text-[0.72rem] text-ivory shadow-lg"
                  style={{
                    left: Math.min(hoverInfo.sx + 14, (wrapRef.current?.clientWidth ?? 0) - 190),
                    top: Math.max(hoverInfo.sy - 52, 8),
                  }}
                >
                  <p className="font-medium tracking-wide">{codeOf(hoverInfo.tree.n)}</p>
                  <p className="text-ivory/70">
                    {cultivars[hoverInfo.tree.cv]} · {dict.common.parcel} {hoverInfo.tree.p} · {dict.common.row}{" "}
                    {hoverInfo.tree.r}
                  </p>
                  <p className="text-ivory/70">
                    {hoverInfo.tree.s === 0
                      ? `${dict.common.available} · ${formatPrice(site.totals.pricePerTree, locale)}`
                      : hoverInfo.tree.s === 1
                        ? dict.common.reserved
                        : dict.common.sold}
                  </p>
                </div>
              )}

              <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
                {[
                  { icon: Plus, action: () => zoomButtons(1.4), label: dict.orchard.zoomIn },
                  { icon: Minus, action: () => zoomButtons(1 / 1.4), label: dict.orchard.zoomOut },
                  { icon: Crosshair, action: resetView, label: dict.orchard.resetView },
                ].map(({ icon: Icon, action, label }) => (
                  <button
                    key={label}
                    onClick={action}
                    aria-label={label}
                    title={label}
                    className="rounded-full bg-white/95 p-2 text-ink shadow-sm transition-colors hover:bg-white"
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>

              <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-full bg-white/85 px-3 py-1.5 text-[0.68rem] text-ink/70 backdrop-blur">
                <span className="flex items-center gap-1.5">
                  <i className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.available }} />
                  {dict.orchard.legend.available}
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.reserved }} />
                  {dict.orchard.legend.reserved}
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.sold }} />
                  {dict.orchard.legend.sold}
                </span>
              </div>
            </div>
          ) : (
            <div className="scrollbar-thin max-h-[62vh] overflow-y-auto">
              <table className="w-full text-left text-[0.8rem]">
                <thead className="sticky top-0 bg-beige/70 text-[0.7rem] uppercase tracking-wider text-ink/60">
                  <tr>
                    <th className="px-4 py-2.5">{dict.common.treeId}</th>
                    <th className="px-4 py-2.5">{dict.common.parcel}</th>
                    <th className="px-4 py-2.5">{dict.common.cultivar}</th>
                    <th className="px-4 py-2.5">{dict.common.planted}</th>
                    <th className="px-4 py-2.5">{dict.common.status}</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 300).map((t) => (
                    <tr key={t.n} className="border-t border-walnut/8 hover:bg-beige/35">
                      <td className="px-4 py-2 font-medium">{codeOf(t.n)}</td>
                      <td className="px-4 py-2">
                        {t.p}
                        {t.r}
                      </td>
                      <td className="px-4 py-2">{cultivars[t.cv]}</td>
                      <td className="px-4 py-2">{t.pl}</td>
                      <td className="px-4 py-2">
                        <span className={`badge badge-${t.s === 0 ? "available" : t.s === 1 ? "reserved" : "sold"}`}>
                          {t.s === 0 ? dict.common.available : t.s === 1 ? dict.common.reserved : dict.common.sold}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => {
                            setView("map");
                            setTimeout(() => focusTree(t.n), 30);
                          }}
                          className="link-underline text-forest"
                        >
                          {dict.common.open}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="p-8 text-center text-[0.85rem] text-ink/55">{dict.common.noResults}</p>}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[0.76rem] text-ink/55">
          <p>
            {dict.orchard.hint} · {dict.orchard.keyboardHint}
          </p>
          <p>
            {dict.orchard.showing}: {filtered.length.toLocaleString(locale === "de" ? "de-DE" : "en-GB")}{" "}
            {dict.common.of} {trees.length.toLocaleString(locale === "de" ? "de-DE" : "en-GB")} {dict.common.trees}
          </p>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card p-5">
          <button onClick={pickBest} disabled={picking} className="btn btn-gold w-full">
            <Sparkles size={16} />
            {picking ? dict.orchard.picking : dict.orchard.pickBest}
          </button>
          {notice && (
            <p className="mt-3 rounded-lg bg-forest/8 px-3 py-2 text-[0.78rem] text-forest">
              {notice} — {dict.orchard.pickedBody}
            </p>
          )}
        </div>

        <TreePanel code={selected} locale={locale} dict={dict} onClose={() => setSelected(null)} />

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">{dict.orchard.selectionTitle}</h2>
            <span className="text-[0.8rem] text-ink/55">{lines.length}</span>
          </div>
          {lines.length === 0 ? (
            <p className="mt-3 text-[0.82rem] text-ink/55">{dict.orchard.selectionEmpty}</p>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {lines.map((line) => (
                  <li key={line.code} className="flex items-center justify-between gap-3 rounded-lg bg-beige/40 px-3 py-2">
                    <div className="text-[0.82rem]">
                      <p className="font-medium">{line.code}</p>
                      <p className="text-ink/55">
                        {line.cultivar} · {dict.common.parcel} {line.parcel}
                      </p>
                    </div>
                    <span className="text-[0.82rem] text-ink/70">{formatPrice(line.price, locale)}</span>
                  </li>
                ))}
              </ul>
              <a href={`/${locale}/cart`} className="btn btn-primary mt-4 w-full">
                {dict.orchard.selectionCta}
              </a>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
