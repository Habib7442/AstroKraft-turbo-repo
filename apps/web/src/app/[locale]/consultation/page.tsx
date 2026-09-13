import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseClient } from "@/lib/supabase";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { ConsultationBookingFlow } from "@/components/consultation-booking-flow";

// 5 min rather than 1 min - see [locale]/page.tsx for the same reasoning
// (repeated crawl/bot traffic every 60-90s was hitting this just past the
// old 1-minute cache expiry almost every time, re-running the categories
// query on nearly every visit instead of serving from cache).
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Book a Consultation",
    description:
      "Book a personalized Vedic astrology consultation with our verified astrologers — Career, Love, Finance, Health, Kundli & Education guidance.",
    path: "/consultation",
    locale: isValidLocale(locale) ? locale : "en"
  });
}

interface ConsultationPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}

export default async function ConsultationPage({ params, searchParams }: ConsultationPageProps) {
  const { locale } = await params;
  const { category: initialCategoryId } = await searchParams;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const supabase = getSupabaseClient();
  // A category with no price set yet can't actually be booked -
  // create-consultation-order rejects it once the customer reaches checkout
  // - so it's excluded here rather than shown as a dead end.
  const { data: categories } = await supabase
    .from("consultation_categories")
    .select("*")
    .eq("is_active", true)
    .gt("price", 0)
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
        <div className="mb-10 text-left">
          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">Book a Consultation</h1>
          <p className="mt-2 text-sm text-ink-body sm:text-base">
            Get personalized guidance from our verified Vedic astrologers.
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold">
            Connected with 100+ verified Vedic astrologers
          </p>
        </div>

        <ConsultationBookingFlow categories={categories ?? []} initialCategoryId={initialCategoryId} locale={locale} />
      </div>
    </main>
  );
}
