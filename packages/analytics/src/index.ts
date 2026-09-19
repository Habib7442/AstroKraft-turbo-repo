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

type PostHogLike = {
  capture: (name: string, props?: Record<string, unknown>, options?: { timestamp?: Date }) => void;
};

interface QueuedEvent {
  event: AnalyticsEvent;
  at: Date;
}

// PostHog is loaded lazily (after idle, via a dynamic import - see
// apps/web/src/components/posthog-init.tsx), so a visitor can add to cart or
// start checkout before window.posthog exists. Those events are held here in
// memory (never persisted anywhere) and replayed, with their original
// timestamps, by flushAnalyticsQueue() once PostHog is ready. Capped so a
// PostHog that never loads (blocked, offline) can't grow this without bound.
const MAX_QUEUED_EVENTS = 50;
let queue: QueuedEvent[] = [];
let disabled = false;

function getPostHog(): PostHogLike | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { posthog?: PostHogLike }).posthog;
}

export function logAnalyticsEvent(event: AnalyticsEvent): void {
  if (disabled || typeof window === "undefined") return;

  const posthog = getPostHog();
  if (posthog) {
    posthog.capture(event.name, event.properties);
    return;
  }

  queue.push({ event, at: new Date() });
  if (queue.length > MAX_QUEUED_EVENTS) queue.shift();
}

// Call once window.posthog has been assigned.
export function flushAnalyticsQueue(): void {
  const posthog = getPostHog();
  if (!posthog) return;

  const pending = queue;
  queue = [];
  for (const { event, at } of pending) {
    posthog.capture(event.name, event.properties, { timestamp: at });
  }
}

// Call when analytics will never load (no project key configured, or the
// client failed to load): drops anything queued and makes later
// logAnalyticsEvent() calls a no-op instead of queueing forever.
export function disableAnalytics(): void {
  disabled = true;
  queue = [];
}
