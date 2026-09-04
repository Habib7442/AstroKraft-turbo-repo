"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useAuth, useClerk } from "@clerk/nextjs";
import type { ConsultationCategory } from "@astrokraft/db";
import { loadRazorpayScript } from "@/lib/load-razorpay-script";
import { AstrologerCard, type AstrologerCardData } from "@/components/astrologer-card";
import { TermsCheckbox } from "@/components/terms-checkbox";

export type AstrologerWithCategories = AstrologerCardData;

interface ConsultationBookingFlowProps {
  categories: ConsultationCategory[];
  astrologers: AstrologerWithCategories[];
  initialAstrologerId?: string;
  locale: string;
}

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

export function ConsultationBookingFlow({ categories, astrologers, initialAstrologerId, locale }: ConsultationBookingFlowProps) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const initialAstrologer = initialAstrologerId ? astrologers.find((a) => a.id === initialAstrologerId) ?? null : null;

  const [skipToForm, setSkipToForm] = useState(Boolean(initialAstrologer));
  const [categoryId, setCategoryId] = useState<string | null>(initialAstrologer?.astrologer_categories[0]?.category_id ?? null);
  const [astrologerId, setAstrologerId] = useState<string | null>(initialAstrologer?.id ?? null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [timeOfBirth, setTimeOfBirth] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const astrologersInCategory = useMemo(() => {
    if (!categoryId) return [];
    return astrologers.filter((a) => a.astrologer_categories.some((c) => c.category_id === categoryId));
  }, [astrologers, categoryId]);

  const selectedAstrologer = astrologers.find((a) => a.id === astrologerId) ?? null;
  const canBook = Boolean(
    categoryId && astrologerId && name.trim().length > 0 && phone.trim().length >= 10 && termsAccepted
  );

  const categoryNameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  const handleSelectCategory = (id: string) => {
    setCategoryId(id);
    setAstrologerId(null);
  };

  const handleBook = async () => {
    if (!canBook || !categoryId || !astrologerId) return;

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
          astrologerId,
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
        description: `Consultation with ${createData.astrologerName}`,
        order_id: createData.razorpayOrderId,
        handler: async (response: any) => {
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

            setSuccess(verifyData.astrologerName || "your astrologer");
          } catch (err: any) {
            setError(err.message || "Payment succeeded but verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => setLoading(false)
        },
        theme: { color: "#5B21B6" }
      });

      razorpay.on("payment.failed", (response: any) => {
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

  if (success) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl">✅</div>
        <h2 className="font-serif text-xl font-bold text-green-800">Consultation Booked!</h2>
        <p className="mt-2 text-sm text-green-700">
          Your consultation with {success} is confirmed. We&rsquo;ll reach out shortly to schedule your session.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {!skipToForm ? (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Select Consultation Category</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => {
              const selected = category.id === categoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleSelectCategory(category.id)}
                  style={{ backgroundColor: category.color ?? "#F1ECFA" }}
                  className={`flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-transform hover:-translate-y-0.5 ${
                    selected ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                    {category.icon || "✨"}
                  </div>
                  <span className="text-xs font-bold uppercase text-foreground">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {!skipToForm && categoryId ? (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Choose Your Astrologer</h2>
          </div>
          {astrologersInCategory.length === 0 ? (
            <p className="text-sm text-ink-body">No astrologers are available in this category yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {astrologersInCategory.map((astrologer) => {
                const selected = astrologer.id === astrologerId;
                return (
                  <button key={astrologer.id} type="button" onClick={() => setAstrologerId(astrologer.id)} className="text-left">
                    <AstrologerCard astrologer={astrologer} categoryNameById={categoryNameById} selected={selected} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {astrologerId ? (
        <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-sm">
          {skipToForm && selectedAstrologer ? (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-tint/40 p-3">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-tint">
                  {selectedAstrologer.photo_url ? (
                    <Image src={selectedAstrologer.photo_url} alt={selectedAstrologer.name} fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">🔮</div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{selectedAstrologer.name}</p>
                  {selectedAstrologer.price ? (
                    <p className="text-xs text-gold font-semibold">{formatPrice(selectedAstrologer.price)}</p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSkipToForm(false);
                  setAstrologerId(null);
                  setCategoryId(null);
                }}
                className="whitespace-nowrap text-xs font-semibold text-primary hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Enter Your Birth Details</h2>
            </div>
          )}

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
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full rounded-lg border border-surface-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-body">Time of Birth</label>
                <input
                  type="text"
                  value={timeOfBirth}
                  onChange={(e) => setTimeOfBirth(e.target.value)}
                  placeholder="HH:MM AM/PM"
                  className="w-full rounded-lg border border-surface-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                  : selectedAstrologer?.price
                    ? `Pay ${formatPrice(selectedAstrologer.price)} & Book`
                    : "Book Consultation"}
            </button>
            {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
