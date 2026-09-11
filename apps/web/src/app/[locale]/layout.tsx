import { getSupabaseClient } from "@/lib/supabase";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LOCALES } from "@/lib/locales";

// LOCALES is small and effectively static (en, bn) - enumerating it here and
// rejecting anything else lets Next.js's router 404 an invalid locale
// (e.g. a stray inbound link to /fr/whatever) before any nested
// page/Suspense boundary ever runs, instead of relying on every leaf page's
// own `if (!isValidLocale(locale)) notFound()` check. That check happens
// deep inside a streamed response - once the outer shell (including any
// loading.tsx fallback) has already sent a 200, Next can't retroactively
// turn it into a real 404, so every one of those pages was serving
// "Not Found" content under an HTTP 200. This sidesteps the problem
// entirely for the locale segment, with no effect on any page's own
// loading.tsx skeleton.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = getSupabaseClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader categories={categories ?? []} locale={locale} />
      {/* Horizontal-overflow safety net lives here, below the sticky header,
          so a stray wide element in page content can never make the page
          scroll sideways — without breaking the header's own stickiness. */}
      <div className="flex-1 overflow-x-hidden">{children}</div>
      <SiteFooter categories={categories ?? []} locale={locale} />
    </div>
  );
}
