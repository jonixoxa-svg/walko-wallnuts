import type { MetadataRoute } from "next";
import { getTrees } from "@/lib/db";
import { baseUrl, LOCALES } from "@/lib/site";

const PAGES = ["", "/orchard", "/how-it-works", "/gallery", "/about", "/faq", "/contact"];
const LEGAL = ["terms", "privacy", "cookies", "refund", "ownership", "risk"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const page of PAGES) {
      entries.push({
        url: `${base}/${locale}${page}`,
        lastModified: now,
        changeFrequency: page === "/orchard" ? "daily" : "weekly",
        priority: page === "" ? 1 : 0.8,
        alternates: {
          languages: Object.fromEntries(LOCALES.map((l) => [l, `${base}/${l}${page}`])),
        },
      });
    }
    for (const slug of LEGAL) {
      entries.push({ url: `${base}/${locale}/legal/${slug}`, lastModified: now, changeFrequency: "yearly", priority: 0.3 });
    }
  }

  // Every tree record is a public page and belongs in the sitemap.
  const trees = await getTrees();
  for (const tree of trees) {
    entries.push({
      url: `${base}/en/tree/${tree.code}`,
      lastModified: new Date(tree.lastInspection),
      changeFrequency: "monthly",
      priority: tree.status === "available" ? 0.7 : 0.4,
      alternates: { languages: { en: `${base}/en/tree/${tree.code}`, de: `${base}/de/tree/${tree.code}` } },
    });
  }

  return entries;
}
