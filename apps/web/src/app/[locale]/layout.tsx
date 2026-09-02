import { getSupabaseClient } from "@/lib/supabase";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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
