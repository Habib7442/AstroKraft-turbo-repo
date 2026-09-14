"use client";

import { useState } from "react";

export function TestimonialForm() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  // Hidden honeypot field - a real visitor never sees or fills this in
  // (see the matching check in /api/platform-reviews). Named plainly so a
  // scripted bot filling every input on the page catches it.
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = name.trim().length >= 2 && rating > 0 && comment.trim().length >= 10;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/platform-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), rating, comment: comment.trim(), website })
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

  if (submitted) {
    return (
      <div className="rounded-lg border border-surface-border bg-surface-card p-5 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-xl">✅</div>
        <h3 className="font-semibold text-foreground">Thanks for your feedback!</h3>
        <p className="mt-1 text-xs text-ink-muted">It&rsquo;ll appear on our homepage once our team approves it.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-surface-border bg-surface-card p-5">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">Share Your Experience</h3>

      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div className="mb-3">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-body">Your Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

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
        placeholder="Tell us about your experience with AstroKraft…"
        rows={4}
        className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !canSubmit}
        className="mt-3 w-full rounded-full bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Submit Review"}
      </button>
      {error ? <p className="mt-2 text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
