"use client";

import { useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useCartStore } from "@astrokraft/core";
import { loadRazorpayScript } from "@/lib/load-razorpay-script";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { isShippingAddressComplete, type ShippingAddress } from "@/components/shipping-address-form";

interface CheckoutButtonProps {
  shippingAddress: ShippingAddress;
}

export function CheckoutButton({ shippingAddress }: CheckoutButtonProps) {
  const mounted = useHasMounted();
  const storeItems = useCartStore((state) => state.items);
  const items = mounted ? storeItems : [];
  const clearCart = useCartStore((state) => state.clearCart);
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addressComplete = isShippingAddressComplete(shippingAddress);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (!isSignedIn) {
      openSignIn({});
      return;
    }

    if (!addressComplete) {
      setError("Please fill in your shipping address before checking out.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load the payment gateway. Check your internet connection and try again.");
      }

      const createRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ variantId: item.variantId ?? item.id, quantity: item.quantity })),
          shippingAddress
        })
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error || "Could not start checkout.");
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: createData.amount,
        currency: createData.currency,
        name: "AstroKraft",
        description: "Vedic Gemstones & Ritual Items",
        order_id: createData.razorpayOrderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: createData.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            clearCart();
            setSuccess(verifyData.orderNumber || "your order");
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
      setError(err.message || "Could not start checkout.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
        Payment successful! Order {success} has been placed.
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || items.length === 0 || (isSignedIn ? !addressComplete : false)}
        className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Starting checkout…" : isSignedIn ? "Proceed to Pay" : "Sign In to Checkout"}
      </button>
      {error ? <p className="mt-2 text-xs font-medium text-destructive">{error}</p> : null}
      {isSignedIn && !addressComplete && !error ? (
        <p className="mt-2 text-xs text-ink-muted">Fill in your shipping address above to continue.</p>
      ) : null}
    </div>
  );
}
