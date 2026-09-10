// Single source of truth for "which screen does this push notification's
// data belong to" — used both when the OS notification itself is tapped
// (use-notification-routing.ts) and when the home screen's bell icon is
// tapped (notification-bell.tsx), so the two can never disagree about
// where a given notification type should land.
//
// Keep in sync with the `data: { type: ... }` shapes sent from
// apps/web/src/lib/send-push-notification.ts callers (currently
// purohit-bookings, razorpay verify-payment, razorpay
// verify-consultation-payment).
export type NotificationRoute =
  | { pathname: "/purohit-bookings" }
  | { pathname: "/consultations" }
  | { pathname: "/order-detail"; params: { id: string } };

export function getNotificationRoute(data: unknown): NotificationRoute | null {
  // On Android, a remote (FCM) push's request.content.data has been
  // observed coming through as a raw JSON string rather than an already-
  // parsed object — a known Expo/Android quirk, not documented as
  // guaranteed either way. Handle both shapes so a tap never silently
  // no-ops just because of that difference.
  let parsed: Record<string, unknown> | null | undefined = null;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch {
      return null;
    }
  } else if (data && typeof data === "object") {
    parsed = data as Record<string, unknown>;
  }

  if (!parsed) return null;

  switch (parsed.type) {
    case "purohit_booking":
      return { pathname: "/purohit-bookings" };
    case "consultation":
      return { pathname: "/consultations" };
    case "order":
      return typeof parsed.orderId === "string" ? { pathname: "/order-detail", params: { id: parsed.orderId } } : null;
    default:
      return null;
  }
}
