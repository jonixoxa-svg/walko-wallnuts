import { en, type Dict } from "./en";
import { de } from "./de";
import { DEFAULT_LOCALE, isLocale, type Locale } from "../site";

export const dictionaries: Record<Locale, Dict> = { en, de };

export function getDict(locale: string): Dict {
  return isLocale(locale) ? dictionaries[locale] : dictionaries[DEFAULT_LOCALE];
}

export function resolveLocale(value: string | undefined | null): Locale {
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

export type { Dict };
