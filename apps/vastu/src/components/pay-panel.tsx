"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Lock, RotateCcw } from "lucide-react";
import { BRAND, CONSULTATION_FEE, CONSULTATION_FEE_LABEL, WHATSAPP_URL } from "@/lib/site";
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

type State = { kind: "idle" } | { kind: "working" } | { kind: "retry"; message: string } | { kind: "paid" };

export function PayPanel({ leadId, initiallyPaid }: { leadId: string; initiallyPaid: boolean }) {
  const [state, setState] = useState<State>(initiallyPaid ? { kind: "paid" } : { kind: "idle" });
  const autoStarted = useRef(false);

  const onPaid = useCallback(() => {
    trackPixel("Purchase", { value: CONSULTATION_FEE, currency: "INR" }, `purchase_${leadId}`);
    setState({ kind: "paid" });
  }, [leadId]);

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
        description: "1:1 Business Vastu Consultation",
        prefill: order.prefill,
        notes: { app: "vastu", leadId },
        theme: { color: "#D4AF37" },
        // Runs after pay() has returned, so pay()'s try/catch doesn't cover it:
        // a failed verify request must still leave the panel usable. Retrying
        // is safe — create-order sees the order is already paid and records it
        // instead of charging again.
        handler: async (r: RazorpaySuccess) => {
          setState({ kind: "working" });
          const unconfirmed =
            "We couldn't confirm your payment yet. Tap below to check again — you won't be charged twice. If money was deducted and this persists, message us on WhatsApp.";
          try {
            const v = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature })
            });
            const json = await v.json().catch(() => ({}));
            if (v.ok && json.paid) return onPaid();
            setState({ kind: "retry", message: json.error || unconfirmed });
          } catch {
            setState({ kind: "retry", message: unconfirmed });
          }
        },
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
  }, [leadId, onPaid]);

  // "Redirected to payment": open checkout straight away on arrival.
  useEffect(() => {
    if (autoStarted.current || initiallyPaid) return;
    autoStarted.current = true;
    void pay();
  }, [pay, initiallyPaid]);

  if (state.kind === "paid") {
    return (
      <div className="mt-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-gold" aria-hidden />
        <h2 className="mt-3 text-xl font-bold text-cream">Payment received — you&apos;re confirmed!</h2>
        <p className="mt-2 text-sm text-muted">
          Keep your floor plan or a few photos of your space ready, and share them with us on WhatsApp before the call.
        </p>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-outline mt-5">
          <WhatsAppIcon className="h-4 w-4" /> Share floor plan on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {state.kind === "retry" && (
        <p role="alert" className="mb-4 rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-cream">
          {state.message}
        </p>
      )}
      <button type="button" onClick={pay} disabled={state.kind === "working"} className="btn-gold w-full">
        {state.kind === "working" ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : state.kind === "retry" ? (
          <RotateCcw className="h-5 w-5" aria-hidden />
        ) : (
          <Lock className="h-5 w-5" aria-hidden />
        )}
        {state.kind === "retry" ? "Retry payment" : `Pay ${CONSULTATION_FEE_LABEL}`}
      </button>
      <p className="mt-3 text-center text-xs text-muted">Secure payment by Razorpay · UPI, cards, netbanking &amp; wallets</p>
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 text-sm text-gold-soft">
        <WhatsAppIcon className="h-4 w-4" /> Need help? WhatsApp us
      </a>
    </div>
  );
}
