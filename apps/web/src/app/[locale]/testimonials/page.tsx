import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { TestimonialForm } from "@/components/testimonial-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Testimonials",
    description: "Share your experience with AstroKraft's gemstones, Rudraksha, Vastu solutions, and astrology consultations.",
    path: "/testimonials",
    locale: isValidLocale(locale) ? locale : "en"
  });
}

// Submission only - the reviews themselves are shown on the homepage's own
// testimonials section instead, so this page doesn't duplicate that list or
// fetch it at all.
export default async function TestimonialsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-lg px-6 py-12 sm:py-16">
        <div className="mb-8 text-left">
          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">Share Your Experience</h1>
          <p className="mt-2 text-sm text-ink-body sm:text-base">
            Tell us about your experience with AstroKraft — no account needed. Approved reviews appear on our
            homepage.
          </p>
        </div>

        <TestimonialForm />
      </div>
    </main>
  );
}
