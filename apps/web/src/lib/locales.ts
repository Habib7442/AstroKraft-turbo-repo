export const LOCALES = ["en", "bn"] as const;
export type Locale = (typeof LOCALES)[number];

// Locales that serve their own content. /bn/* currently renders the same
// English copy as /en/*, so middleware 308s it to /en/* and it is left out
// of the sitemap and hreflang. Add "bn" here once /bn has real translations.
export const INDEXABLE_LOCALES: readonly Locale[] = ["en"];

export function isValidLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
