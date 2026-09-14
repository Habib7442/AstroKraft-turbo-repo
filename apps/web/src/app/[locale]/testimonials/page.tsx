import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PlatformReview } from "@astrokraft/db";
import { getSupabaseClient } from "@/lib/supabase";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { TestimonialForm } from "@/components/testimonial-form";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Testimonials",
    description: "Read what customers say about AstroKraft's gemstones, Rudraksha, Vastu solutions, and astrology consultations — and share your own experience.",
    path: "/testimonials",
    locale: isValidLocale(locale) ? locale : "en"
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm text-gold" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-surface-border">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function TestimonialsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("platform_reviews")
    .select("id, name, rating, comment, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading platform reviews:", error);
  }

  const reviews = (data as Pick<PlatformReview, "id" | "name" | "rating" | "comment" | "created_at">[]) ?? [];
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
        <div className="mb-10 text-left">
          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">Testimonials</h1>
          <p className="mt-2 text-sm text-ink-body sm:text-base">
            What our customers say about AstroKraft — and your own experience is welcome too, no account needed.
          </p>
          {reviews.length > 0 ? (
            <span className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
              <Stars rating={Math.round(averageRating)} />
              <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span> ({reviews.length} review
              {reviews.length === 1 ? "" : "s"})
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {error ? (
              <p className="text-sm text-destructive">Couldn&rsquo;t load testimonials right now — please try again shortly.</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-ink-muted">No testimonials yet — be the first to share your experience.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-surface-border bg-surface-card p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-foreground">{r.name}</span>
                          <span className="ml-auto text-xs text-ink-muted">{formatDate(r.created_at)}</span>
                        </div>
                        <div className="mt-1">
                          <Stars rating={r.rating} />
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-ink-body">{r.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <TestimonialForm />
        </div>
      </div>
    </main>
  );
}
