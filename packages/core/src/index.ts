export * from "./cart";

export type OrderStatus =
  | "created"
  | "payment_pending"
  | "paid"
  | "payment_failed"
  | "processing"
  | "shipped"
  | "delivered"
  | "refund_requested"
  | "refunded"
  | "cancelled";

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ["payment_pending", "cancelled"],
  payment_pending: ["paid", "payment_failed", "cancelled"],
  payment_failed: ["payment_pending", "cancelled"],
  paid: ["processing", "refund_requested", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refund_requested"],
  refund_requested: ["refunded", "delivered"],
  refunded: [],
  cancelled: []
};

export function canTransitionOrder(current: OrderStatus, next: OrderStatus): boolean {
  return ORDER_TRANSITIONS[current]?.includes(next) ?? false;
}

export type ConsultationStatus = "payment_pending" | "payment_failed" | "booked" | "completed" | "cancelled" | "no_show";

export const CONSULTATION_TRANSITIONS: Record<ConsultationStatus, ConsultationStatus[]> = {
  payment_pending: ["booked", "payment_failed", "cancelled"],
  payment_failed: ["payment_pending", "cancelled"],
  booked: ["completed", "no_show", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: []
};

export function canTransitionConsultation(current: ConsultationStatus, next: ConsultationStatus): boolean {
  return CONSULTATION_TRANSITIONS[current]?.includes(next) ?? false;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}
