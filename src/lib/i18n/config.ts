export const localeCookieName = "locale";

export const locales = ["es", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export function normalizeLocale(value: unknown): Locale {
  return value === "en" ? "en" : defaultLocale;
}
