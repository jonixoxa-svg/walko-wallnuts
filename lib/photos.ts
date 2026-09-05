import data from "@/data/photos.json";

export interface Photo {
  name: string;
  src: string;
  theme: string;
  w: number;
  h: number;
  blur: string;
  credit: string;
  creditUrl: string;
  license: string;
  licenseUrl: string;
}

export const photos = data.photos as Photo[];

export const byTheme: Record<string, Photo[]> = photos.reduce<Record<string, Photo[]>>((acc, p) => {
  (acc[p.theme] ||= []).push(p);
  return acc;
}, {});

export const bySrc: Record<string, Photo> = Object.fromEntries(photos.map((p) => [p.src, p]));

/** Deterministic pick from a theme (falls back to the whole pool). */
export function pick(theme: string, seed: number): Photo {
  const pool = byTheme[theme]?.length ? byTheme[theme] : photos;
  return pool[Math.abs(Math.floor(seed)) % pool.length];
}

export function pickFrom(themes: string[], seed: number): Photo {
  const pool = themes.flatMap((t) => byTheme[t] || []);
  const list = pool.length ? pool : photos;
  return list[Math.abs(Math.floor(seed)) % list.length];
}

export function credit(src: string): Photo | undefined {
  return bySrc[src];
}
