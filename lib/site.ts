/**
 * Central place for every business detail that the client should confirm
 * before launch. Everything marked PLACEHOLDER is invented for the demo.
 */

export const site = {
  brand: "Walko Walnuts",
  brandShort: "Walko",
  legalName: "Walko Walnuts GmbH", // PLACEHOLDER
  domain: "walko-walnuts.com", // PLACEHOLDER
  founded: 2009,

  totals: {
    trees: 2000,
    sold: 700,
    pricePerTree: 200, // EUR
    currency: "EUR",
    currencySymbol: "€",
  },

  contact: {
    email: "hello@walko-walnuts.com", // PLACEHOLDER
    ownersEmail: "owners@walko-walnuts.com", // PLACEHOLDER
    phone: "+43 660 1234567", // PLACEHOLDER
    phoneHref: "+436601234567", // PLACEHOLDER
    whatsapp: "436601234567", // PLACEHOLDER
    addressLines: ["Walko Walnuts", "Talweg 14", "8330 Feldbach", "Austria"], // PLACEHOLDER
    vat: "ATU00000000", // PLACEHOLDER
    register: "FN 000000a, Regional Court Graz", // PLACEHOLDER
    iban: "AT00 0000 0000 0000 0000", // PLACEHOLDER
    bic: "XXXXATWWXXX", // PLACEHOLDER
  },

  /** Geographic centre of the orchard. PLACEHOLDER coordinates. */
  location: {
    lat: 46.9503,
    lng: 15.8878,
    label: "Feldbach, Styria, Austria", // PLACEHOLDER
    mapsQuery: "46.9503,15.8878",
    altitude: "310 m above sea level",
    area: "24 hectares",
  },

  social: {
    instagram: "https://instagram.com/", // PLACEHOLDER
    facebook: "https://facebook.com/", // PLACEHOLDER
    youtube: "https://youtube.com/", // PLACEHOLDER
  },

  /** Demo accounts seeded into the local database. */
  demoAccounts: {
    owner: { email: "owner@walko-walnuts.com", password: "walnut2026" },
    worker: { email: "field@walko-walnuts.com", password: "orchard2026" },
    admin: { email: "admin@walko-walnuts.com", password: "estate2026" },
  },
} as const;

export const LOCALES = ["en", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function baseUrl() {
  // Render injects RENDER_EXTERNAL_URL at runtime; a custom domain overrides it.
  const url =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3012";
  return url.replace(/\/$/, "");
}

export function formatPrice(amount: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency: site.totals.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
