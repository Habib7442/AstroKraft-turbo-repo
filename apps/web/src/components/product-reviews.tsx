"use client";

import { useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";

export interface ReviewRow {
  id: string;
  rating: number;
  comment: string;
  is_verified_buyer: boolean;
  created_at: string;
  reviewerName: string;
}

interface ProductReviewsProps {
  productId: string;
  reviews: ReviewRow[];
  averageRating: number;
  reviewCount: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Stars({ rating, size = "text-sm" }: { rating: number; size?: string }) {
  return (
    <span className={`${size} text-gold`} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-surface-border">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ProductReviews({ productId, reviews, averageRating, reviewCount }: ProductReviewsProps) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = rating > 0 && comment.trim().length >= 5;

  const handleSubmit = async () => {
    if (!isSignedIn) {
      openSignIn({});
      return;
    }
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment: comment.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not submit your review.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Could not submit your review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-surface-border pb-6">
        <h2 className="font-serif text-2xl font-bold text-foreground">Customer Reviews</h2>
        {reviewCount > 0 ? (
          <span className="flex items-center gap-1.5 text-sm text-ink-muted">
            <Stars rating={Math.round(averageRating)} />
            <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span> ({reviewCount} review
            {reviewCount === 1 ? "" : "s"})
          </span>
        ) : (
          <span className="text-sm text-ink-muted">No reviews yet — be the first to write one.</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {reviews.length === 0 ? (
            <p className="text-sm text-ink-muted">No approved reviews yet for this product.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-lg border border-surface-border bg-surface-card p-4">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Stars rating={r.rating} />
                    <span className="text-sm font-semibold text-foreground">{r.reviewerName}</span>
                    {r.is_verified_buyer ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                        Verified Buyer
                      </span>
                    ) : null}
                    <span className="ml-auto text-xs text-ink-muted">{formatDate(r.created_at)}</span>
                  </div>
                  <p className="text-sm text-ink-body">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-surface-border bg-surface-card p-5">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-xl">✅</div>
              <h3 className="font-semibold text-foreground">Thanks for your review!</h3>
              <p className="mt-1 text-xs text-ink-muted">It'll appear here once our team approves it.</p>
            </div>
          ) : (
            <>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">Write a Review</h3>
              <div className="mb-3 flex items-center gap-1 text-2xl">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${n} out of 5`}
                    className={n <= (hoverRating || rating) ? "text-gold" : "text-surface-border"}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product…"
                rows={4}
                className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || (isSignedIn && !canSubmit)}
                className="mt-3 w-full rounded-full bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting…" : isSignedIn ? "Submit Review" : "Sign In to Review"}
              </button>
              {error ? <p className="mt-2 text-xs font-medium text-destructive">{error}</p> : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
