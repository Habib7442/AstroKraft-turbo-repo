import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Order } from "@astrokraft/db";
import { formatINR, ORDER_TRANSITIONS } from "@astrokraft/core";
import { useSupabase } from "@/lib/supabase";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import {
  Button,
  Card,
  EmptyState,
  FilterPills,
  LoadingState,
  RefreshableScrollView,
  Screen,
  ScreenHeader,
  StatusBadge
} from "@/components/ui";

const ORDER_FILTERS = ["all", "paid", "processing", "shipped", "delivered"] as const;
type OrderFilter = (typeof ORDER_FILTERS)[number];

const NEXT_STATUS_ACTION: Record<string, { next: string; label: string; variant: "primary" | "success" }> = {
  paid: { next: "processing", label: "Mark Processing", variant: "primary" },
  processing: { next: "shipped", label: "Mark Shipped", variant: "primary" },
  shipped: { next: "delivered", label: "Mark Delivered", variant: "success" }
};

export default function OrdersScreen() {
  const supabase = useSupabase();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderFilter>("all");

  const loadOrders = async () => {
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) throw error;
    setOrders(data || []);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      await loadOrders();
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    try {
      await loadOrders();
    } catch (err) {
      console.error("Error refreshing orders:", err);
    }
  });

  const handleUpdateStatus = async (orderId: string, currentStatus: string, nextStatus: string) => {
    try {
      const allowedNext = ORDER_TRANSITIONS[currentStatus as keyof typeof ORDER_TRANSITIONS];
      if (!allowedNext || !allowedNext.includes(nextStatus as any)) {
        Alert.alert("Transition Error", `Cannot transition order from ${currentStatus} to ${nextStatus}.`);
        return;
      }

      const { error } = await supabase
        .from("orders")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;
      Alert.alert("Status Updated", `Order transitioned to ${nextStatus.toUpperCase()}`);
      fetchOrders();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update order status.");
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Order Operations" subtitle="Order State Machine & Fulfillment Workflow">
        <FilterPills options={ORDER_FILTERS} value={filter} onChange={setFilter} scroll />
      </ScreenHeader>

      <RefreshableScrollView refreshing={refreshing} onRefresh={onRefresh} contentContainerStyle={{ padding: 16, gap: 14 }}>
        {loading ? (
          <LoadingState />
        ) : orders.length === 0 ? (
          <EmptyState title="No Orders Found" description="Customer orders placed on the Next.js storefront will appear here." />
        ) : (
          orders.map((item) => {
            const action = NEXT_STATUS_ACTION[item.status];
            return (
              <Card key={item.id} className="gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-rubik-bold text-foreground">#{item.order_number}</Text>
                  <StatusBadge label={item.status} tone="primary" />
                </View>

                <View className="flex-row justify-between items-center my-1">
                  <Text className="text-xs text-ink-body">
                    Total: <Text className="font-rubik-bold text-primary">{formatINR(item.total_amount)}</Text>
                  </Text>
                  <Text className="text-[10px] text-ink-muted">{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>

                {action ? (
                  <View className="pt-2 border-t border-surface-border flex-row gap-2">
                    <Button
                      label={action.label}
                      variant={action.variant}
                      flex
                      onPress={() => handleUpdateStatus(item.id, item.status, action.next)}
                    />
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </RefreshableScrollView>
    </Screen>
  );
}
