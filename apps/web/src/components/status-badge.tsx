const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  booked: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  delivered: "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-blue-100 text-blue-700",
  created: "bg-amber-100 text-amber-700",
  payment_pending: "bg-amber-100 text-amber-700",
  payment_failed: "bg-red-100 text-red-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-red-100 text-red-700",
  refund_requested: "bg-purple-100 text-purple-700",
  refunded: "bg-purple-100 text-purple-700"
};

const STATUS_LABELS: Record<string, string> = {
  payment_pending: "Payment Pending",
  payment_failed: "Payment Failed",
  no_show: "No Show",
  refund_requested: "Refund Requested"
};

function formatStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-surface-tint text-ink-muted";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${style}`}>
      {formatStatusLabel(status)}
    </span>
  );
}
