import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseClient } from "@/lib/supabase";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { ConsultationBookingFlow, type AstrologerWithCategories } from "@/components/consultation-booking-flow";

export const revalidate = 60;

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
  searchParams: Promise<{ astrologer?: string }>;
}

export default async function ConsultationPage({ params, searchParams }: ConsultationPageProps) {
  const { locale } = await params;
  const { astrologer: initialAstrologerId } = await searchParams;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const supabase = getSupabaseClient();
  const [{ data: categories }, { data: astrologers }] = await Promise.all([
    supabase.from("consultation_categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase
      .from("astrologers")
      .select("*, astrologer_categories(category_id)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
  ]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">Book a Consultation</h1>
          <p className="mt-2 text-sm text-ink-body sm:text-base">
            Get personalized guidance from our verified Vedic astrologers.
          </p>
        </div>

        <ConsultationBookingFlow
          categories={categories ?? []}
          astrologers={(astrologers as AstrologerWithCategories[] | null) ?? []}
          initialAstrologerId={initialAstrologerId}
          locale={locale}
        />
      </div>
    </main>
  );
}
