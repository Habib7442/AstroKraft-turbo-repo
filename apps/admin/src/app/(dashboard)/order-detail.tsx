import React, { useEffect, useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Order, OrderItem, Profile } from "@astrokraft/db";
import { formatINR, ORDER_TRANSITIONS, type OrderStatus } from "@astrokraft/core";
import { useSupabase } from "@/lib/supabase";
import { Button, Card, LoadingState, RefreshableScrollView, Screen, ScreenHeader, StatusBadge } from "@/components/ui";
import type { BadgeTone, ButtonVariant } from "@/components/ui";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  created: "neutral",
  payment_pending: "saffron",
  payment_failed: "danger",
  paid: "gold",
  processing: "primary",
  shipped: "primary",
  delivered: "success",
  refund_requested: "saffron",
  refunded: "neutral",
  cancelled: "danger"
};

interface OrderAction {
  label: string;
  next: OrderStatus;
  variant: ButtonVariant;
  confirmMessage?: string;
}

// Only the admin-triggerable subset of ORDER_TRANSITIONS — payment
// pending/failed → paid is the payment gateway's job, not the admin's.
const STATUS_ACTIONS: Partial<Record<OrderStatus, OrderAction[]>> = {
  created: [{ label: "Cancel Order", next: "cancelled", variant: "destructive" }],
  payment_pending: [{ label: "Cancel Order", next: "cancelled", variant: "destructive" }],
  payment_failed: [{ label: "Cancel Order", next: "cancelled", variant: "destructive" }],
  paid: [
    { label: "Mark Processing", next: "processing", variant: "primary" },
    { label: "Request Refund", next: "refund_requested", variant: "dangerSoft", confirmMessage: "Flag this order for refund?" },
    { label: "Cancel Order", next: "cancelled", variant: "destructive", confirmMessage: "Cancel this order?" }
  ],
  processing: [
    { label: "Mark Shipped", next: "shipped", variant: "primary" },
    { label: "Cancel Order", next: "cancelled", variant: "destructive", confirmMessage: "Cancel this order?" }
  ],
  shipped: [{ label: "Mark Delivered", next: "delivered", variant: "success" }],
  delivered: [
    { label: "Request Refund", next: "refund_requested", variant: "dangerSoft", confirmMessage: "Flag this delivered order for refund?" }
  ],
  refund_requested: [{ label: "Reject Refund (Mark Delivered)", next: "delivered", variant: "secondary" }]
};

interface OrderWithJoins extends Order {
  order_items: OrderItem[];
  profiles: Profile | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").toUpperCase();
}

interface ShippingAddress {
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const supabase = useSupabase();
  const [order, setOrder] = useState<OrderWithJoins | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrder = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), profiles(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    setOrder(data as OrderWithJoins | null);
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      await loadOrder();
    } catch (err) {
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };

  // Depend on the primitive `id`, not on `loadOrder`/`fetchOrder` themselves —
  // useSupabase() re-memoizes on every render (Clerk's getToken isn't
  // referentially stable), so any callback derived from it is a new
  // reference each render too. Depending on that reference here caused an
  // infinite refetch loop (visible as the screen flickering between loading
  // and loaded state).
  useEffect(() => {
    fetchOrder();
  }, [id]);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    try {
      await loadOrder();
    } catch (err) {
      console.error("Error refreshing order:", err);
    }
  });

  const runTransition = async (nextStatus: OrderStatus) => {
    if (!order) return;
    const allowedNext = ORDER_TRANSITIONS[order.status as OrderStatus];
    if (!allowedNext?.includes(nextStatus)) {
      Alert.alert("Transition Error", `Cannot transition order from ${order.status} to ${nextStatus}.`);
      return;
    }

    setActionLoading(nextStatus);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", order.id);
      if (error) throw error;
      await loadOrder();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update order status.");
    } finally {
      setActionLoading(null);
    }
  };

  const runRefund = async () => {
    if (!order) return;
    setActionLoading("refunded");
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-refund", { body: { orderId: order.id } });
      if (error) {
        // supabase-js's FunctionsHttpError only carries a generic "non-2xx
        // status code" message — the actual { error: "..." } body we sent
        // back is on error.context, a Response that has to be read/parsed
        // separately to get the real reason.
        let detail = error.message;
        try {
          const body = await error.context?.json();
          if (body?.error) detail = body.error;
        } catch {
          // context wasn't JSON (e.g. a network-level failure) — fall back to error.message
        }
        throw new Error(detail);
      }
      if (!data?.success) throw new Error(data?.error || "Refund failed.");
      Alert.alert("Refunded", "The payment has been refunded via Razorpay.");
      await loadOrder();
    } catch (err: any) {
      Alert.alert("Refund Failed", err.message || "Could not process the refund.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = (action: OrderAction) => {
    const run = () => (action.next === "refunded" ? runRefund() : runTransition(action.next));
    if (action.confirmMessage) {
      Alert.alert("Confirm", action.confirmMessage, [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", style: "destructive", onPress: run }
      ]);
    } else {
      run();
    }
  };

  if (loading || !order) {
    return (
      <Screen>
        <ScreenHeader
          title="Order Details"
          action={
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" onPress={() => router.back()} suppressHighlighting />
          }
        />
        {loading ? <LoadingState /> : <Text className="text-center text-ink-muted mt-10">Order not found.</Text>}
      </Screen>
    );
  }

  const address = order.shipping_address as ShippingAddress;
  const hasAddress = Boolean(address?.line1);
  const actions = STATUS_ACTIONS[order.status as OrderStatus] ?? [];

  return (
    <Screen>
      <ScreenHeader
        title={`#${order.order_number}`}
        subtitle={formatDate(order.created_at)}
        action={<Ionicons name="chevron-back" size={24} color="#FFFFFF" onPress={() => router.back()} suppressHighlighting />}
      />

      <RefreshableScrollView refreshing={refreshing} onRefresh={onRefresh} contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Card className="gap-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-rubik-bold uppercase text-ink-muted">Status</Text>
            <StatusBadge label={formatStatusLabel(order.status)} tone={STATUS_TONE[order.status as OrderStatus] ?? "neutral"} />
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-xs text-ink-body">Total</Text>
            <Text className="text-base font-rubik-bold text-primary">{formatINR(order.total_amount)}</Text>
          </View>
        </Card>

        <Card className="gap-2">
          <Text className="text-xs font-rubik-bold uppercase text-ink-muted mb-1">Customer</Text>
          <Text className="text-sm font-rubik-medium text-foreground">{order.profiles?.full_name || "Guest"}</Text>
          {order.profiles?.email ? <Text className="text-xs text-ink-body">{order.profiles.email}</Text> : null}
        </Card>

        <Card className="gap-2">
          <Text className="text-xs font-rubik-bold uppercase text-ink-muted mb-1">Shipping Address</Text>
          {hasAddress ? (
            <>
              <Text className="text-sm font-rubik-medium text-foreground">{address.fullName}</Text>
              <Text className="text-xs text-ink-body">{address.phone}</Text>
              <Text className="text-xs text-ink-body">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
              </Text>
              <Text className="text-xs text-ink-body">
                {address.city}, {address.state} - {address.pincode}
              </Text>
            </>
          ) : (
            <Text className="text-xs text-ink-muted">No shipping address on file (order placed before address capture was added).</Text>
          )}
        </Card>

        <Card className="gap-3">
          <Text className="text-xs font-rubik-bold uppercase text-ink-muted">Items ({order.order_items.length})</Text>
          {order.order_items.map((item) => (
            <View key={item.id} className="flex-row items-center gap-3 border-t border-surface-border pt-3">
              <View className="w-12 h-12 rounded-lg bg-surface-muted overflow-hidden items-center justify-center">
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} className="w-12 h-12" resizeMode="cover" />
                ) : (
                  <Ionicons name="diamond-outline" size={20} color="#9CA3AF" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm text-foreground" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-xs text-ink-muted">Qty: {item.quantity}</Text>
              </View>
              <Text className="text-sm font-rubik-bold text-foreground">{formatINR(item.price * item.quantity)}</Text>
            </View>
          ))}
        </Card>

        <Card className="gap-2">
          <Text className="text-xs font-rubik-bold uppercase text-ink-muted mb-1">Payment</Text>
          <View className="flex-row justify-between">
            <Text className="text-xs text-ink-body">Razorpay Order ID</Text>
            <Text className="text-xs text-foreground">{order.razorpay_order_id || "—"}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-ink-body">Razorpay Payment ID</Text>
            <Text className="text-xs text-foreground">{order.razorpay_payment_id || "—"}</Text>
          </View>
        </Card>

        {actions.length > 0 ? (
          <Card className="gap-2">
            <Text className="text-xs font-rubik-bold uppercase text-ink-muted mb-1">Actions</Text>
            {actions.map((action) => (
              <Button
                key={action.next + action.label}
                label={action.label}
                variant={action.variant}
                loading={actionLoading === action.next}
                onPress={() => handleAction(action)}
              />
            ))}
          </Card>
        ) : null}

        {order.status === "refund_requested" ? (
          <Card className="gap-2">
            <Text className="text-xs font-rubik-bold uppercase text-ink-muted mb-1">Process Refund</Text>
            <Text className="text-xs text-ink-body mb-1">
              This calls Razorpay directly and refunds the full payment — this cannot be undone.
            </Text>
            <Button
              label="Process Refund via Razorpay"
              variant="destructive"
              loading={actionLoading === "refunded"}
              onPress={() =>
                Alert.alert("Confirm Refund", "This will refund the payment via Razorpay immediately. Continue?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Refund", style: "destructive", onPress: runRefund }
                ])
              }
            />
          </Card>
        ) : null}
      </RefreshableScrollView>
    </Screen>
  );
}
