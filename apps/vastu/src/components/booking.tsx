"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import {
  VASTU_BUSINESS_CATEGORIES,
  VASTU_BUSINESS_PROBLEMS,
  vastuLeadSchema,
  type VastuLeadInput
} from "@astrokraft/validators";
import { captureAttribution, getAttribution } from "@/lib/attribution";
import { CONSULTATION_FEE, CONSULTATION_FEE_LABEL } from "@/lib/site";
import { CalEmbed, type CalPrefill } from "./cal-embed";
import { trackPixel } from "./meta-pixel";

const BookingContext = createContext<{ open: () => void }>({ open: () => {} });

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => {
    setOpen(true);
    trackPixel("InitiateCheckout", { value: CONSULTATION_FEE, currency: "INR" });
  }, []);
  const value = useMemo(() => ({ open }), [open]);

  useEffect(() => captureAttribution(), []);

  return (
    <BookingContext.Provider value={value}>
      {children}
      {isOpen && <BookingSheet onClose={() => setOpen(false)} />}
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

const STAGES: { value: VastuLeadInput["businessStage"]; label: string }[] = [
  { value: "existing", label: "Existing business" },
  { value: "new", label: "New business" },
  { value: "expansion", label: "Planning expansion" }
];

const STEP_LABELS = ["Your details", "Pick a slot", `Pay ${CONSULTATION_FEE_LABEL}`];

function BookingSheet({ onClose }: { onClose: () => void }) {
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
              Book your 1:1 Business Vastu Consultation
            </h2>
            <ol className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {STEP_LABELS.map((label, i) => (
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
          {step.kind === "form" && <IntakeForm onDone={(prefill) => setStep({ kind: "calendar", prefill })} />}
          {step.kind === "calendar" && (
            <div>
              <p className="mb-3 text-sm text-muted">
                Choose a convenient slot. You'll pay {CONSULTATION_FEE_LABEL} on the next screen to confirm it.
              </p>
              <CalEmbed
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

type FormState = Omit<VastuLeadInput, "attribution" | "consent" | "businessCategory" | "businessStage"> & {
  businessCategory: VastuLeadInput["businessCategory"] | "";
  businessStage: VastuLeadInput["businessStage"] | "";
  consent: boolean;
};

const INITIAL: FormState = {
  fullName: "",
  whatsapp: "",
  city: "",
  state: "",
  businessCategory: "",
  businessStage: "",
  problems: [],
  floorPlanAvailable: false,
  consent: false,
  website: ""
};

function IntakeForm({ onDone }: { onDone: (prefill: CalPrefill) => void }) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [floorPlanAnswered, setFloorPlanAnswered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggleProblem = (p: (typeof VASTU_BUSINESS_PROBLEMS)[number]) =>
    set("problems", form.problems.includes(p) ? form.problems.filter((x) => x !== p) : [...form.problems, p]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!floorPlanAnswered) return setError("Let us know if a floor plan is available");

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

      trackPixel("Lead", { content_category: parsed.data.businessCategory }, `lead_${json.leadId}`);
      onDone({
        leadId: json.leadId,
        name: parsed.data.fullName,
        phone: json.whatsapp,
        notes: [
          `${parsed.data.businessCategory} (${parsed.data.businessStage})`,
          `${parsed.data.city}, ${parsed.data.state}`,
          `Problems: ${parsed.data.problems.join(", ")}`,
          `Floor plan: ${parsed.data.floorPlanAvailable ? "Yes" : "No"}`
        ].join(" | ")
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
        <Field label="Full name">
          <input className="field" autoComplete="name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
        </Field>
        <Field label="Phone / WhatsApp number">
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
          <input className="field" autoComplete="address-level2" value={form.city} onChange={(e) => set("city", e.target.value)} required />
        </Field>
        <Field label="State">
          <input className="field" autoComplete="address-level1" value={form.state} onChange={(e) => set("state", e.target.value)} required />
        </Field>
      </div>

      <Field label="Business category">
        <select
          className="field"
          value={form.businessCategory}
          onChange={(e) => set("businessCategory", e.target.value as FormState["businessCategory"])}
          required
        >
          <option value="" disabled>
            Select your business
          </option>
          {VASTU_BUSINESS_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-cream">Business stage</legend>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <label key={s.value} className="chip">
              <input
                type="radio"
                name="stage"
                className="sr-only"
                checked={form.businessStage === s.value}
                onChange={() => set("businessStage", s.value)}
              />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-cream">
          Main business problem <span className="font-normal text-muted">(choose all that apply)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {VASTU_BUSINESS_PROBLEMS.map((p) => (
            <label key={p} className="chip">
              <input type="checkbox" className="sr-only" checked={form.problems.includes(p)} onChange={() => toggleProblem(p)} />
              {form.problems.includes(p) && <Check className="-ml-0.5 mr-1 inline h-3.5 w-3.5" aria-hidden />}
              {p}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-cream">Do you have a floor plan of your business space?</legend>
        <div className="flex gap-2">
          {[true, false].map((v) => (
            <label key={String(v)} className="chip">
              <input
                type="radio"
                name="floorplan"
                className="sr-only"
                checked={floorPlanAnswered && form.floorPlanAvailable === v}
                onChange={() => {
                  setFloorPlanAnswered(true);
                  set("floorPlanAvailable", v);
                }}
              />
              {v ? "Yes" : "No"}
            </label>
          ))}
        </div>
        {floorPlanAnswered && form.floorPlanAvailable && (
          <p className="mt-2 text-xs text-muted">Great — please share it with us on WhatsApp after booking so it can be reviewed before your call.</p>
        )}
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
        Continue to pick a slot
      </button>
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
