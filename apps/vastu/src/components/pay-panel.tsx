"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Lock, RotateCcw } from "lucide-react";
import { BRAND, OFFERS, whatsappLink, type OfferId } from "@/lib/site";
import { trackPixel } from "./meta-pixel";
import { WhatsAppIcon } from "./whatsapp-icon";

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

// `pending` = a payment Razorpay reported as successful that we haven't yet
// managed to verify. While set, the button re-checks that same payment
// instead of opening checkout again (which could take a second payment).
type State =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "retry"; message: string; pending?: RazorpaySuccess }
  | { kind: "paid" };

const UNCONFIRMED =
  "Your payment went through but we couldn't confirm it yet. Tap “Check payment status” — don't pay again. If this persists, message us on WhatsApp.";

export function PayPanel({
  leadId,
  offerId,
  initiallyPaid,
  fullName,
  slot,
  hasFloorPlan
}: {
  leadId: string;
  offerId: OfferId;
  initiallyPaid: boolean;
  fullName: string;
  /** Short IST slot label, e.g. "Mon, 3 Nov, 5:00 pm"; null if Cal.com hasn't reported it yet. */
  slot: string | null;
  /** null = skipped the optional question; ask for either. */
  hasFloorPlan: boolean | null;
}) {
  const offer = OFFERS[offerId];
  const [state, setState] = useState<State>(initiallyPaid ? { kind: "paid" } : { kind: "idle" });
  const autoStarted = useRef(false);

  const onPaid = useCallback(() => {
    trackPixel("Purchase", { value: offer.fee, currency: "INR" }, `purchase_${leadId}`);
    setState({ kind: "paid" });
  }, [leadId, offer]);

  // Verify a Razorpay success response server-side. Also used by the
  // "Check payment status" button, with the same signed response.
  const verify = useCallback(
    async (r: RazorpaySuccess) => {
      setState({ kind: "working" });
      try {
        const v = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature })
        });
        const json = await v.json().catch(() => ({}));
        if (v.ok && json.paid) return onPaid();
        if (json.error) console.error("payment verify failed:", json.error);
        setState({ kind: "retry", message: UNCONFIRMED, pending: r });
      } catch {
        setState({ kind: "retry", message: UNCONFIRMED, pending: r });
      }
    },
    [onPaid]
  );

  const pay = useCallback(async () => {
    setState({ kind: "working" });
    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId })
      });
      const order = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(order.error || "Could not start payment.");
      if (order.alreadyPaid) return setState({ kind: "paid" });

      const Razorpay = await loadRazorpay();
      if (!Razorpay) throw new Error("Payment window failed to load. Check your connection and try again.");

      const rzp = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: BRAND,
        description: offer.name,
        prefill: order.prefill,
        notes: { app: "vastu", leadId },
        theme: { color: "#D4AF37" },
        // Runs after pay() has returned, so pay()'s try/catch doesn't cover
        // it — verify() handles its own failures.
        handler: (r: RazorpaySuccess) => void verify(r),
        modal: {
          ondismiss: () =>
            setState((s) => (s.kind === "working" ? { kind: "retry", message: "Payment was not completed. Your slot is held — pay now to confirm it." } : s))
        }
      });
      rzp.on("payment.failed", (r) =>
        setState({ kind: "retry", message: r.error?.description ? `Payment failed: ${r.error.description}` : "Payment failed. Please try again." })
      );
      rzp.open();
    } catch (error) {
      setState({ kind: "retry", message: error instanceof Error ? error.message : "Something went wrong. Please try again." });
    }
  }, [leadId, offer, verify]);

  // "Redirected to payment": open checkout straight away on arrival.
  useEffect(() => {
    if (autoStarted.current || initiallyPaid) return;
    autoStarted.current = true;
    void pay();
  }, [pay, initiallyPaid]);

  if (state.kind === "paid") {
    const copy =
      hasFloorPlan === null
        ? {
            what: `floor plan / ${offer.space} photos`,
            note: "Send your floor plan on WhatsApp — or, if you don't have one, photos of each room and the main door — before your call.",
            button: "Send floor plan or photos on WhatsApp"
          }
        : hasFloorPlan
          ? {
              what: "floor plan",
              note: "Send your floor plan on WhatsApp now, so it can be checked before your call.",
              button: "Send floor plan on WhatsApp"
            }
          : {
              what: `${offer.space} photos`,
              note: "No floor plan? Send a few photos of each room and the main door, or a rough sketch — on WhatsApp, before your call.",
              button: `Send photos of your ${offer.space} on WhatsApp`
            };
    const shareUrl = whatsappLink(
      `Hi, I've booked my ${offer.callName}${slot ? ` for ${slot}` : ""}. Sharing my ${copy.what} here — ${fullName.trim()}`
    );
    return (
      <div className="mt-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-gold" aria-hidden />
        <h2 className="mt-3 text-xl font-bold text-cream">Payment received — you&apos;re confirmed!</h2>
        <p className="mt-2 text-sm text-muted">{copy.note}</p>
        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="btn-gold mt-5 whitespace-normal">
          <WhatsAppIcon className="h-4 w-4" /> {copy.button}
        </a>
      </div>
    );
  }

  const pending = state.kind === "retry" ? state.pending : undefined;

  return (
    <div className="mt-6">
      {state.kind === "retry" && (
        <p role="alert" className="mb-4 rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-cream">
          {state.message}
        </p>
      )}
      <button
        type="button"
        onClick={() => (pending ? verify(pending) : pay())}
        disabled={state.kind === "working"}
        className="btn-gold w-full"
      >
        {state.kind === "working" ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : state.kind === "retry" ? (
          <RotateCcw className="h-5 w-5" aria-hidden />
        ) : (
          <Lock className="h-5 w-5" aria-hidden />
        )}
        {pending ? "Check payment status" : state.kind === "retry" ? "Retry payment" : `Pay ${offer.feeLabel}`}
      </button>
      <p className="mt-3 text-center text-xs text-muted">Secure payment by Razorpay · UPI, cards, netbanking &amp; wallets</p>
      <a
        href={whatsappLink(`Hi, I need help paying for my ${offer.callName}${slot ? ` (${slot})` : ""} — ${fullName.trim()}`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 text-sm text-gold-soft"
      >
        <WhatsAppIcon className="h-4 w-4" /> Need help? WhatsApp us
      </a>
    </div>
  );
}
