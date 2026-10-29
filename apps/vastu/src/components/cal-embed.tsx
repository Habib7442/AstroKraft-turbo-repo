"use client";

import { useEffect, useRef } from "react";
import { CAL_ORIGIN } from "@/lib/site";

const NAMESPACE = "vastu";

type CalApi = ((...args: unknown[]) => void) & { ns?: Record<string, (...args: unknown[]) => void>; loaded?: boolean; q?: unknown[] };
type CalWindow = Window & { Cal?: CalApi };

// Cal.com's official embed loader snippet, typed. Queues calls until
// embed.js has loaded, and creates per-namespace APIs on "init".
function ensureCalLoader(origin: string): CalApi {
  const w = window as CalWindow;
  if (w.Cal) return w.Cal;
  const scriptSrc = `${origin.replace("://cal.com", "://app.cal.com")}/embed/embed.js`;
  const push = (api: { q: unknown[] }, args: unknown) => api.q.push(args);
  const cal = function (this: unknown, ...args: unknown[]) {
    const c = w.Cal as CalApi & { q: unknown[] };
    if (!c.loaded) {
      c.ns = {};
      c.q = c.q || [];
      document.head.appendChild(document.createElement("script")).src = scriptSrc;
      c.loaded = true;
    }
    if (args[0] === "init") {
      const api = function (...a: unknown[]) {
        push(api as unknown as { q: unknown[] }, a);
      } as unknown as ((...a: unknown[]) => void) & { q: unknown[] };
      api.q = api.q || [];
      const namespace = args[1];
      if (typeof namespace === "string") {
        c.ns![namespace] = c.ns![namespace] || api;
        push(c.ns![namespace] as unknown as { q: unknown[] }, args);
        push(c, ["initNamespace", namespace]);
      } else push(c, args);
      return;
    }
    push(c, args);
  } as CalApi;
  w.Cal = cal;
  return cal;
}

export type CalPrefill = {
  leadId: string;
  name: string;
  phone: string; // E.164
  notes: string;
};

export function CalEmbed({ calLink, prefill, onBooked }: { calLink: string; prefill: CalPrefill; onBooked: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onBookedRef = useRef(onBooked);
  onBookedRef.current = onBooked;

  useEffect(() => {
    if (!calLink || !containerRef.current) return;
    const Cal = ensureCalLoader(CAL_ORIGIN);
    Cal("init", NAMESPACE, { origin: CAL_ORIGIN });
    const api = Cal.ns![NAMESPACE];

    api("inline", {
      elementOrSelector: containerRef.current,
      calLink,
      config: {
        layout: "month_view",
        theme: "light",
        name: prefill.name,
        notes: prefill.notes,
        // Cal.com's phone booking field and its SMS-workflow reminder number.
        attendeePhoneNumber: prefill.phone,
        smsReminderNumber: prefill.phone,
        // Echoed back in every webhook payload → links the booking to our lead row.
        "metadata[leadId]": prefill.leadId
      }
    });
    api("ui", {
      theme: "light",
      hideEventTypeDetails: false,
      layout: "month_view",
      cssVarsPerTheme: { dark: { "cal-brand": "#D4AF37" }, light: { "cal-brand": "#A8841F" } }
    });

    let fired = false;
    const handler = () => {
      if (fired) return;
      fired = true;
      onBookedRef.current();
    };
    api("on", { action: "bookingSuccessfulV2", callback: handler });
    api("on", { action: "bookingSuccessful", callback: handler });
    return () => {
      api("off", { action: "bookingSuccessfulV2", callback: handler });
      api("off", { action: "bookingSuccessful", callback: handler });
    };
  }, [calLink, prefill]);

  if (!calLink) {
    return (
      <p className="rounded-xl border border-crimson/40 bg-crimson/10 p-4 text-sm text-cream">
        Booking calendar is not configured yet (NEXT_PUBLIC_CAL_LINK).
      </p>
    );
  }

  return <div ref={containerRef} className="min-h-[560px] w-full overflow-auto rounded-xl" />;
}
