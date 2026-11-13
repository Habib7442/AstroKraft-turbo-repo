"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trackPixel } from "@/components/meta-pixel";

/**
 * Fires the Meta Pixel Purchase once per registration. The eventID matches the
 * server-side CAPI Purchase sent by markRegistrationPaid, so Meta counts it
 * once; the sessionStorage flag stops a page refresh from re-firing it.
 */
export function PurchasePixel({ registrationId, value }: { registrationId: string; value: number }) {
  useEffect(() => {
    const key = `mc_purchase_${registrationId}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      // storage blocked — eventID dedupe still prevents double counting
    }
    // The pixel script loads afterInteractive; give it a moment if needed.
    // The flag is set only once the event was actually dispatched, so a timer
    // cancelled by an early unmount doesn't suppress the next attempt.
    const fire = () => {
      trackPixel("Purchase", { value, currency: "INR", content_name: "Astro Vastu Masterclass" }, `purchase_mc_${registrationId}`);
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        // see above
      }
    };
    const w = window as unknown as { fbq?: unknown };
    if (w.fbq) fire();
    else {
      const t = setTimeout(fire, 1500);
      return () => clearTimeout(t);
    }
  }, [registrationId, value]);
  return null;
}

/** While a payment is still being confirmed (webhook in flight), re-check every 3s for ~45s. */
export function PendingRefresher() {
  const router = useRouter();
  const tries = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      tries.current += 1;
      if (tries.current > 15) clearInterval(id);
      else router.refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
