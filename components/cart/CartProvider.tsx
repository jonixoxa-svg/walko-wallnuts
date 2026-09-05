"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { site } from "@/lib/site";

export interface CartLine {
  code: string;
  parcel: string;
  cultivar: string;
  price: number;
  photo?: string;
}

interface CartValue {
  lines: CartLine[];
  count: number;
  total: number;
  has: (code: string) => boolean;
  add: (line: CartLine) => void;
  remove: (code: string) => void;
  clear: () => void;
  lastAdded: string | null;
  ready: boolean;
}

const STORAGE_KEY = "walko.selection.v1";

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) setLines(parsed.filter((l) => typeof l?.code === "string"));
      }
    } catch {
      /* private mode, cleared storage — start empty */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore quota / disabled storage */
    }
  }, [lines, ready]);

  const add = useCallback((line: CartLine) => {
    setLines((current) =>
      current.some((l) => l.code === line.code)
        ? current
        : [...current, { ...line, price: line.price || site.totals.pricePerTree }]
    );
    setLastAdded(line.code);
    window.setTimeout(() => setLastAdded((c) => (c === line.code ? null : c)), 1600);
  }, []);

  const remove = useCallback((code: string) => {
    setLines((current) => current.filter((l) => l.code !== code));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(
    () => ({
      lines,
      count: lines.length,
      total: lines.reduce((sum, l) => sum + l.price, 0),
      has: (code: string) => lines.some((l) => l.code === code),
      add,
      remove,
      clear,
      lastAdded,
      ready,
    }),
    [lines, add, remove, clear, lastAdded, ready]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
