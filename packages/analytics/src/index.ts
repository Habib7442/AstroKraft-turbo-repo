export type AnalyticsEvent =
  | { name: "page_viewed"; properties: { path: string; locale: string } }
  | { name: "product_viewed"; properties: { id: string; name: string; price: number } }
  | { name: "add_to_cart"; properties: { productId: string; qty: number } }
  | { name: "checkout_started"; properties: { cartTotal: number; itemCount: number } }
  | { name: "payment_succeeded"; properties: { orderId: string; amount: number; method: string } }
  | { name: "payment_failed"; properties: { orderId: string; reason: string } }
  | { name: "consultation_booked"; properties: { astrologerId: string; fee: number } }
  | { name: "tool_used"; properties: { tool: "kundli" | "matching" | "panchang" } };

export function logAnalyticsEvent(event: AnalyticsEvent): void {
  // PostHog event tracking wrapper stub
  if (typeof window !== "undefined" && (window as unknown as { posthog?: { capture: (name: string, props?: Record<string, unknown>) => void } }).posthog) {
    (window as unknown as { posthog: { capture: (name: string, props?: Record<string, unknown>) => void } }).posthog.capture(
      event.name,
      event.properties
    );
  }
}
