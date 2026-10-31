"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import {
  VASTU_BUSINESS_CONCERNS,
  VASTU_BUSINESS_TYPES,
  VASTU_CONCERNS,
  vastuLeadSchema,
  type VastuLeadInput
} from "@astrokraft/validators";
import { captureAttribution, getAttribution } from "@/lib/attribution";
import { FLAT_CATEGORY, OFFERS, type Offer, type OfferId } from "@/lib/site";
import { CalEmbed, type CalPrefill } from "./cal-embed";
import { trackPixel } from "./meta-pixel";
import { WhatsAppIcon } from "./whatsapp-icon";

const BookingContext = createContext<{ open: () => void }>({ open: () => {} });

export function BookingProvider({ offer: offerId = "flat", children }: { offer?: OfferId; children: React.ReactNode }) {
  const offer = OFFERS[offerId];
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => {
    setOpen(true);
  }, []);
  const value = useMemo(() => ({ open }), [open]);

  useEffect(() => captureAttribution(), []);

  return (
    <BookingContext.Provider value={value}>
      {children}
      {isOpen && <BookingSheet offer={offer} onClose={() => setOpen(false)} />}
    </BookingContext.Provider>
  );
}

export function BookNowButton({ className = "btn-gold", children }: { className?: string; children?: React.ReactNode }) {
  const { open } = useContext(BookingContext);
  return (
    <button type="button" onClick={open} className={className}>
      {children ?? (
        <>
          Book Now <ArrowRight className="h-5 w-5" aria-hidden />
        </>
      )}
    </button>
  );
}

type Step = { kind: "form" } | { kind: "calendar"; prefill: CalPrefill } | { kind: "redirecting" };

function BookingSheet({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  const stepLabels = ["Your details", "Pick a slot", `Pay ${offer.feeLabel}`];
  const [step, setStep] = useState<Step>({ kind: "form" });
  const stepIndex = step.kind === "form" ? 0 : step.kind === "calendar" ? 1 : 2;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-gold-line bg-night-800 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-night-600 px-5 py-4">
          <div>
            <h2 id="booking-title" className="text-lg font-bold text-cream">
              Book your {offer.callName} — {offer.feeLabel}
            </h2>
            <ol className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {stepLabels.map((label, i) => (
                <li key={label} className={i <= stepIndex ? "font-semibold text-gold" : "text-muted"}>
                  {i + 1}. {label}
                </li>
              ))}
            </ol>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-muted hover:bg-night-700 hover:text-cream">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5">
          {step.kind === "form" && <IntakeForm offer={offer} onDone={(prefill) => setStep({ kind: "calendar", prefill })} />}
          {step.kind === "calendar" && (
            <div>
              <p className="mb-3 text-sm text-muted">
                Choose a convenient slot. You'll pay {offer.feeLabel} on the next screen to confirm it.
              </p>
              <CalEmbed
                calLink={offer.calLink}
                prefill={step.prefill}
                onBooked={() => {
                  trackPixel("Schedule", {}, `schedule_${step.prefill.leadId}`);
                  setStep({ kind: "redirecting" });
                  window.location.assign(`/pay/${step.prefill.leadId}`);
                }}
              />
            </div>
          )}
          {step.kind === "redirecting" && (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-gold" aria-hidden />
              <p className="mt-4 font-semibold text-cream">Slot booked! Taking you to payment…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type FormState = Omit<VastuLeadInput, "attribution" | "consent"> & { consent: boolean };

const INITIAL: FormState = {
  fullName: "",
  whatsapp: "",
  city: "",
  offer: "flat",
  businessType: undefined,
  concern: undefined,
  floorPlanAvailable: undefined,
  consent: false,
  website: ""
};

function IntakeForm({ offer, onDone }: { offer: Offer; onDone: (prefill: CalPrefill) => void }) {
  const isBusiness = offer.id === "business";
  const concerns: readonly string[] = isBusiness ? VASTU_BUSINESS_CONCERNS : VASTU_CONCERNS;
  const [form, setForm] = useState<FormState>({ ...INITIAL, offer: offer.id });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = { ...form, attribution: getAttribution() };
    const parsed = vastuLeadSchema.safeParse(payload);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Please check your details");

    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");

      const category = parsed.data.businessType ?? FLAT_CATEGORY;
      trackPixel("Lead", { content_category: parsed.data.concern ?? category }, `lead_${json.leadId}`);
      onDone({
        leadId: json.leadId,
        name: parsed.data.fullName,
        phone: json.whatsapp,
        notes: [
          isBusiness ? `Business Vastu: ${category}` : "Flat Vastu",
          parsed.data.city,
          parsed.data.concern && `Concern: ${parsed.data.concern}`,
          parsed.data.floorPlanAvailable !== undefined && `Floor plan: ${parsed.data.floorPlanAvailable ? "Yes" : "No"}`
        ]
          .filter(Boolean)
          .join(" | ")
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <input className="field" autoComplete="name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
        </Field>
        <Field label="WhatsApp number">
          <div className="flex">
            <span className="flex items-center rounded-l-xl border border-r-0 border-night-600 bg-night-600 px-3 text-sm text-muted">+91</span>
            <input
              className="field rounded-l-none"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={18}
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              required
            />
          </div>
        </Field>
        <Field label="City">
          <input
            className="field"
            autoComplete="address-level2"
            placeholder="e.g. Kolkata"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            required
          />
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-cream">{isBusiness ? "Have a floor plan or layout?" : "Have a floor plan?"}</legend>
          <div className="flex gap-2">
            {[true, false].map((v) => (
              <label key={String(v)} className="chip flex-1 py-3 text-center">
                <input
                  type="radio"
                  name="floorplan"
                  className="sr-only"
                  checked={form.floorPlanAvailable === v}
                  onChange={() => set("floorPlanAvailable", v)}
                />
                {form.floorPlanAvailable === v && <Check className="-ml-0.5 mr-1 inline h-3.5 w-3.5" aria-hidden />}
                {v ? "Yes" : "No"}
              </label>
            ))}
          </div>
          {form.floorPlanAvailable !== undefined && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
              {form.floorPlanAvailable ? "Great — send it on WhatsApp after booking." : "No problem — photos or a rough sketch work too."}
            </p>
          )}
        </fieldset>
      </div>

      {isBusiness && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-cream">Type of business</legend>
          <div className="flex flex-wrap gap-2">
            {VASTU_BUSINESS_TYPES.map((t) => (
              <label key={t} className="chip">
                <input
                  type="radio"
                  name="businessType"
                  className="sr-only"
                  checked={form.businessType === t}
                  onChange={() => set("businessType", t)}
                />
                {form.businessType === t && <Check className="-ml-0.5 mr-1 inline h-3.5 w-3.5" aria-hidden />}
                {t}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-cream">
          Main concern <span className="font-normal text-muted">(optional)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {concerns.map((c) => (
            <label key={c} className="chip">
              <input
                type="radio"
                name="concern"
                className="sr-only"
                checked={form.concern === c}
                onClick={() => form.concern === c && set("concern", undefined)}
                onChange={() => set("concern", c as FormState["concern"])}
              />
              {form.concern === c && <Check className="-ml-0.5 mr-1 inline h-3.5 w-3.5" aria-hidden />}
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Honeypot: hidden from people, filled by bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        value={form.website}
        onChange={(e) => set("website", e.target.value)}
      />

      <label className="flex items-start gap-3 text-sm text-muted">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-[#D4AF37]"
          checked={form.consent}
          onChange={(e) => set("consent", e.target.checked)}
        />
        <span>
          I am 18 or older and agree to the{" "}
          <a href="/policies#privacy" target="_blank" className="text-gold-soft underline">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a href="/policies#refunds" target="_blank" className="text-gold-soft underline">
            Payment, Refund &amp; Rescheduling terms
          </a>
          . I agree to be contacted on WhatsApp/SMS about my booking.
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-cream">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-gold w-full whitespace-normal text-center">
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
        Continue to pick a slot <ArrowRight className="h-5 w-5" aria-hidden />
      </button>
      <p className="-mt-2 text-center text-xs text-muted">Secure payment · Report + 30-min call included</p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-cream">{label}</span>
      {children}
    </label>
  );
}
