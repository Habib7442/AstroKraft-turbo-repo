export const LOCALES = ["en", "bn"] as const;
export type Locale = (typeof LOCALES)[number];

export function isValidLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
