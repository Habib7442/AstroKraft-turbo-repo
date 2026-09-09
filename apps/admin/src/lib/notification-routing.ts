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

export function getNotificationRoute(data: Record<string, unknown> | undefined | null): NotificationRoute | null {
  if (!data) return null;

  switch (data.type) {
    case "purohit_booking":
      return { pathname: "/purohit-bookings" };
    case "consultation":
      return { pathname: "/consultations" };
    case "order":
      return typeof data.orderId === "string" ? { pathname: "/order-detail", params: { id: data.orderId } } : null;
    default:
      return null;
  }
}
