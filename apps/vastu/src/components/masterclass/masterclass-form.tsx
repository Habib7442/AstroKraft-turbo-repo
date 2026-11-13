"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { masterclassRegistrationSchema } from "@astrokraft/validators";
import { captureAttribution, getAttribution } from "@/lib/attribution";
import { trackPixel } from "@/components/meta-pixel";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

type RazorpaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: (res: { error?: { description?: string } }) => void) => void };
type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

function loadRazorpay(): Promise<RazorpayCtor | null> {
  return new Promise((resolve) => {
    const w = window as unknown as { Razorpay?: RazorpayCtor };
    if (w.Razorpay) return resolve(w.Razorpay);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(w.Razorpay ?? null);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
}

// The visitor's own registration id from their last create-order call. Sent
// back on a retry so the server reuses that row (and its still-payable order)
// — the server never reuses a row looked up by phone number alone.
const REGISTRATION_KEY = "mc_registration";
const readRegistrationId = () => {
  try {
    return sessionStorage.getItem(REGISTRATION_KEY) || undefined;
  } catch {
    return undefined;
  }
};
const saveRegistrationId = (id: string) => {
  try {
    sessionStorage.setItem(REGISTRATION_KEY, id);
  } catch {
    // private mode etc. — a retry just starts a fresh registration
  }
};

// Longest the "confirming" overlay waits on the verify call before moving on;
// the thank-you page then waits for the webhook itself.
const VERIFY_TIMEOUT_MS = 15_000;

const thankYouUrl = (registrationId: string) => `/vastu-masterclass/thank-you?id=${encodeURIComponent(registrationId)}`;

type FieldErrors = Partial<Record<"fullName" | "whatsapp", string>>;

export function MasterclassForm({ feeLabel, fee }: { feeLabel: string; fee: number }) {
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // True from the moment Razorpay reports success until the browser has
  // navigated to the thank-you page — shows a full-screen "confirming" overlay
  // so the gap (verify call + page load) never looks like nothing happened.
  const [confirming, setConfirming] = useState(false);

  useEffect(() => captureAttribution(), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = masterclassRegistrationSchema.safeParse({
      fullName,
      whatsapp,
      website,
      attribution: getAttribution(),
      registrationId: readRegistrationId()
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if ((key === "fullName" || key === "whatsapp") && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);

    try {
      const res = await fetch("/api/masterclass/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });
      const order = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(order.error || "Could not start payment. Please try again.");
      if (order.registrationId) saveRegistrationId(order.registrationId);
      if (order.alreadyPaid) {
        setConfirming(true);
        window.location.assign(thankYouUrl(order.registrationId));
        return;
      }

      trackPixel("InitiateCheckout", { value: fee, currency: "INR" }, `initiate_mc_${order.registrationId}`);

      const Razorpay = await loadRazorpay();
      if (!Razorpay) throw new Error("Payment window failed to load. Check your connection and try again.");

      const rzp = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "AstroKraft",
        description: "Astro Vastu Masterclass — Intro Session",
        prefill: order.prefill,
        notes: { app: "vastu-masterclass", registrationId: order.registrationId },
        theme: { color: "#F2C14E" },
        handler: async (r: RazorpaySuccess) => {
          // Payment is done on Razorpay's side. Verify, then always go to the
          // thank-you page — if verification hiccups, that page waits for the
          // signed webhook instead of leaving the buyer on a payment form.
          // The overlay stays up through the navigation (the old page remains
          // visible until the thank-you page has loaded).
          setConfirming(true);
          try {
            await fetch("/api/masterclass/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
              signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS)
            });
          } catch {
            // network error or timeout — handled by the thank-you page's pending state
          }
          window.location.assign(thankYouUrl(order.registrationId));
        },
        modal: { ondismiss: () => setBusy(false) }
      });
      rzp.on("payment.failed", (r) => {
        setFormError(r.error?.description ? `Payment failed: ${r.error.description}` : "Payment failed. Please try again.");
        setBusy(false);
      });
      rzp.open();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const inputBase =
    "w-full rounded-xl border bg-mc-card px-4 py-2.5 text-[15px] text-white placeholder:text-mc-muted/60 outline-none transition focus-visible:ring-2 focus-visible:ring-mc-gold";

  return (
    <>
    {confirming && (
      <div
        role="status"
        aria-live="assertive"
        className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-mc-ink/95 px-6 text-center backdrop-blur-sm"
      >
        <Loader2 className="h-14 w-14 animate-spin text-mc-gold" aria-hidden />
        <p className="mt-6 font-mc-display text-3xl uppercase tracking-wide text-white sm:text-4xl">Payment received ✓</p>
        <p className="mt-2 text-base text-white/85">Confirming your seat and opening your confirmation…</p>
        <p className="mt-4 text-sm text-mc-muted">Please don&apos;t close this page or pay again.</p>
      </div>
    )}
    <form onSubmit={submit} noValidate className="mc-card relative p-5 pt-6 lg:pb-4 lg:pt-5" aria-label="Book the masterclass">
      {/* Urgency pill sitting on the card's top edge — seen right before booking, adds no layout height.
          Deliberately no seat count or timer: nothing here we can't stand behind. */}
      <p className="absolute -top-3.5 left-5 inline-flex max-w-[calc(100%-2.5rem)] items-center gap-2 whitespace-nowrap rounded-full border border-mc-gold/70 bg-mc-ink px-3 py-1 text-xs font-semibold tracking-wide text-mc-gold">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full rounded-full bg-mc-gold opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-mc-gold" />
        </span>
        Limited seats available
      </p>
      <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-x-4">
        <label htmlFor="mc-name" className="text-sm font-semibold text-white">
          Full Name
        </label>
        <div>
          <input
            id="mc-name"
            autoComplete="name"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "mc-name-error" : undefined}
            className={`${inputBase} ${errors.fullName ? "border-red-400" : "border-mc-gold-deep/70"}`}
          />
          {errors.fullName && (
            <p id="mc-name-error" role="alert" className="mt-1.5 text-xs text-red-300">
              {errors.fullName}
            </p>
          )}
        </div>

        <label htmlFor="mc-whatsapp" className="text-sm font-semibold text-white">
          WhatsApp Number
        </label>
        <div>
          <div
            className={`flex items-center rounded-xl border bg-mc-card focus-within:ring-2 focus-within:ring-mc-gold ${
              errors.whatsapp ? "border-red-400" : "border-mc-gold-deep/70"
            }`}
          >
            <span className="flex items-center gap-1.5 pl-4 pr-2 text-[15px] text-white" aria-hidden>
              <WhatsAppIcon className="h-5 w-5" /> +91
            </span>
            <input
              id="mc-whatsapp"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={14}
              placeholder="WhatsApp number"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              aria-invalid={!!errors.whatsapp}
              aria-describedby={errors.whatsapp ? "mc-whatsapp-error" : undefined}
              className="w-full rounded-r-xl bg-transparent py-2.5 pr-4 text-[15px] text-white placeholder:text-mc-muted/60 outline-none"
            />
          </div>
          {errors.whatsapp && (
            <p id="mc-whatsapp-error" role="alert" className="mt-1.5 text-xs text-red-300">
              {errors.whatsapp}
            </p>
          )}
        </div>
      </div>

      {/* Honeypot: hidden from people, filled by bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />

      <button type="submit" disabled={busy} className="mc-cta mt-4 w-full lg:py-3">
        {busy ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : null}
        {busy ? "Opening payment…" : `Book Now — ${feeLabel}`}
      </button>

      {formError && (
        <p role="alert" className="mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {formError}
        </p>
      )}

      {/* Transparency line — kept legible on purpose (not the tiny muted fine-print style below it). */}
      <p className="mt-3 text-center text-xs leading-relaxed text-white/85 lg:mt-2 lg:leading-snug">
        <strong className="font-semibold text-white">{feeLabel} is the workshop registration fee only.</strong> Any courses,
        services, or products shared during the session are optional and priced separately.
      </p>

      <p className="mt-1.5 flex items-start justify-center gap-1.5 lg:mt-1 text-center text-[11px] leading-relaxed text-mc-muted">
        <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        <span>
          By booking you confirm you are 18+ and agree to our{" "}
          <a href="/policies#privacy" target="_blank" className="underline decoration-mc-gold/60 underline-offset-2 hover:text-white">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a href="/policies#payment" target="_blank" className="underline decoration-mc-gold/60 underline-offset-2 hover:text-white">
            Payment Terms
          </a>
          .
        </span>
      </p>
    </form>
    </>
  );
}
