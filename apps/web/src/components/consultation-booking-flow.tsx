"use client";

import { useEffect, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import type { ConsultationCategory } from "@astrokraft/db";
import { logAnalyticsEvent } from "@astrokraft/analytics";
import { loadRazorpayScript } from "@/lib/load-razorpay-script";
import { TermsCheckbox } from "@/components/terms-checkbox";

interface ConsultationBookingFlowProps {
  categories: ConsultationCategory[];
  initialCategoryId?: string;
  locale: string;
}

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

// The customer picks a category only - which specific astrologer handles the
// session is an internal call an admin makes afterward (from the admin app's
// Consultations screen), based on category and real-time availability across
// our network of 100+ astrologers. That's why there's no "choose your
// astrologer" step here anymore: picking a category goes straight to the
// booking form.
export function ConsultationBookingFlow({ categories, initialCategoryId, locale }: ConsultationBookingFlowProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const initialCategory = initialCategoryId ? categories.find((c) => c.id === initialCategoryId) ?? null : null;

  const [categoryId, setCategoryId] = useState<string | null>(initialCategory?.id ?? null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [timeOfBirth, setTimeOfBirth] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  // Razorpay closes its own modal (firing ondismiss, which resets `loading`)
  // the instant payment succeeds - well before our own server has finished
  // verifying the signature, updating the booking, and sending the owner's
  // notifications. Without a separate flag for that gap, the customer would
  // briefly see the booking form again, fully editable, looking like nothing
  // happened. This flag keeps a loader up for that whole window instead.
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;
  const canBook = Boolean(categoryId && name.trim().length > 0 && phone.trim().length >= 10 && termsAccepted);

  // Picking a category asks the visitor to sign in up front, before the form
  // even appears, rather than letting them fill in birth details first and
  // only discover the sign-in gate at the final "Book" click. isLoaded gates
  // this so a signed-in user whose auth state just hasn't resolved yet on
  // this render doesn't get a spurious sign-in prompt flashed at them.
  useEffect(() => {
    if (categoryId && isLoaded && !isSignedIn) {
      openSignIn({});
    }
  }, [categoryId, isLoaded, isSignedIn, openSignIn]);

  // Clerk's auth state isn't known during SSR/first paint (isLoaded is
  // false), so this shows a neutral placeholder rather than the form itself
  // - otherwise a signed-out visitor would see the form flash for a moment
  // before the sign-in gate below replaces it.
  const showAuthLoadingPlaceholder = Boolean(categoryId) && !isLoaded;
  const showSignInGate = Boolean(categoryId) && isLoaded && !isSignedIn;

  const handleBook = async () => {
    if (!canBook || !categoryId) return;

    if (!isSignedIn) {
      openSignIn({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load the payment gateway. Check your internet connection and try again.");
      }

      const createRes = await fetch("/api/razorpay/create-consultation-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          dob,
          timeOfBirth,
          placeOfBirth,
          termsAccepted
        })
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error || "Could not start booking.");
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: createData.amount,
        currency: createData.currency,
        name: "AstroKraft",
        description: `${createData.categoryName} Consultation`,
        order_id: createData.razorpayOrderId,
        handler: async (response: any) => {
          // Razorpay's checkout modal is already closing itself at this
          // point (payment succeeded on their end) - keep the loader up
          // until our own server confirms the booking, instead of letting
          // the form become interactive again in between.
          setVerifying(true);
          try {
            const verifyRes = await fetch("/api/razorpay/verify-consultation-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                consultationId: createData.consultationId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            logAnalyticsEvent({
              name: "consultation_booked",
              properties: { categoryId: categoryId ?? "unknown", fee: createData.amount / 100 }
            });
            setSuccess(verifyData.categoryName || "your");
            setVerifying(false);
          } catch (err: any) {
            setError(err.message || "Payment succeeded but verification failed. Please contact support.");
            setVerifying(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false)
        },
        theme: { color: "#5B21B6" }
      });

      razorpay.on("payment.failed", (response: any) => {
        logAnalyticsEvent({
          name: "payment_failed",
          properties: { orderId: createData.consultationId, reason: response?.error?.description || "unknown" }
        });
        setError(response?.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      razorpay.open();
    } catch (err: any) {
      setError(err.message || "Could not start booking.");
    } finally {
      setLoading(false);
    }
  };

  // success checked first (even though the code above always clears
  // verifying alongside setSuccess) so this can never get stuck showing the
  // loader forever if a future edit sets success without also clearing it.
  if (success) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl">✅</div>
        <h2 className="font-serif text-xl font-bold text-green-800">Consultation Booked!</h2>
        <p className="mt-2 text-sm text-green-700">
          Your {success} booking is confirmed. We&rsquo;ll assign one of our 100+ verified astrologers and reach out
          shortly to schedule your session.
        </p>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-surface-border bg-surface-card p-8 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <h2 className="font-serif text-lg font-bold text-foreground">Confirming your payment…</h2>
        <p className="mt-2 text-sm text-ink-body">This only takes a few seconds. Please don&rsquo;t close this page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {!categoryId ? (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Select Consultation Category</h2>
          </div>
          <p className="mb-4 text-xs text-ink-body">
            We&rsquo;ll match you with the right expert from our network of 100+ verified Vedic astrologers.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                style={{ backgroundColor: category.color ?? "#F1ECFA" }}
                className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-transform hover:-translate-y-0.5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                  {category.icon || "✨"}
                </div>
                <span className="text-xs font-bold uppercase text-foreground">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {categoryId && showAuthLoadingPlaceholder ? (
        <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-sm">
          <div className="h-24 animate-pulse rounded-xl bg-surface-tint" />
        </div>
      ) : null}

      {categoryId && showSignInGate ? (
        // The effect above already opened Clerk's modal automatically; this
        // stays visible as a fallback in case they closed it without signing
        // in.
        <div className="rounded-2xl border border-surface-border bg-surface-card p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">Sign in to continue booking your consultation.</p>
          <p className="mt-1 text-xs text-ink-body">We&rsquo;ll bring you right back here once you&rsquo;re signed in.</p>
          <button
            type="button"
            onClick={() => openSignIn({})}
            className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            Sign In
          </button>
        </div>
      ) : null}

      {categoryId && selectedCategory && !showAuthLoadingPlaceholder && !showSignInGate ? (
        <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-tint/40 p-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
                style={{ backgroundColor: selectedCategory.color ?? "#F1ECFA" }}
              >
                {selectedCategory.icon || "✨"}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{selectedCategory.name}</p>
                {selectedCategory.price ? (
                  <p className="text-xs text-gold font-semibold">{formatPrice(selectedCategory.price)}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className="whitespace-nowrap text-xs font-semibold text-primary hover:underline"
            >
              Change
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-body">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-lg border border-surface-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-body">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-lg border border-surface-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-body">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-lg border border-surface-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-body">Time of Birth</label>
                <input
                  type="time"
                  value={timeOfBirth}
                  onChange={(e) => setTimeOfBirth(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-body">Place of Birth</label>
              <input
                type="text"
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
                placeholder="City, State"
                className="w-full rounded-lg border border-surface-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <TermsCheckbox checked={termsAccepted} onChange={setTermsAccepted} locale={locale} />

            <button
              type="button"
              onClick={handleBook}
              disabled={!canBook || loading}
              className="mt-2 w-full rounded-full bg-gold py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Starting checkout…"
                : !isSignedIn
                  ? "Sign In to Book"
                  : selectedCategory.price
                    ? `Pay ${formatPrice(selectedCategory.price)} & Book`
                    : "Book Consultation"}
            </button>
            {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
