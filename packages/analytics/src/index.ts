// Funnel events only - deliberately no names, phone numbers, emails, birth
// details, or addresses. Anything personal in a property would end up in a
// third-party analytics tool (see the privacy policy's "Data Sharing").
export type AnalyticsEvent =
  | { name: "page_viewed"; properties: { path: string; locale: string } }
  | { name: "product_viewed"; properties: { id: string; name: string; price: number } }
  | { name: "add_to_cart"; properties: { productId: string; qty: number } }
  | { name: "checkout_started"; properties: { cartTotal: number; itemCount: number } }
  | { name: "payment_succeeded"; properties: { orderId: string; amount: number } }
  | { name: "payment_failed"; properties: { orderId: string; reason: string } }
  | { name: "consultation_booked"; properties: { categoryId: string; fee: number } }
  | { name: "tool_used"; properties: { tool: "kundli" | "matching" | "panchang" } };

type PostHogLike = { capture: (name: string, props?: Record<string, unknown>) => void };

// No-ops until the PostHog client has actually loaded (see
// apps/web/src/components/posthog-init.tsx, which sets window.posthog) - so
// callers can fire events unconditionally, before consent/idle-load/an unset
// project key make PostHog available.
export function logAnalyticsEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  const posthog = (window as unknown as { posthog?: PostHogLike }).posthog;
  posthog?.capture(event.name, event.properties);
}
