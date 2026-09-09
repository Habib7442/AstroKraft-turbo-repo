import React, { useCallback, useEffect, useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Button, Card, EmptyState, LoadingState, RefreshableScrollView, Screen, ScreenHeader } from "@/components/ui";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { getNotificationRoute } from "@/lib/notification-routing";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

interface NotificationItem {
  identifier: string;
  title: string;
  body: string;
  data: Record<string, unknown> | undefined;
  date: number;
}

// Reached from the home screen's bell when more than one notification is
// pending — the bell itself only handles the 0/1 cases directly. Reads
// straight from the OS notification tray (same source as the bell's badge
// count), so there's no separate history/storage to keep in sync.
export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (isExpoGo) {
      setItems([]);
      return;
    }
    const Notifications = await import("expo-notifications");
    const presented = await Notifications.getPresentedNotificationsAsync();
    const sorted = [...presented].sort((a, b) => b.date - a.date);
    setItems(
      sorted.map((n) => ({
        identifier: n.request.identifier,
        title: n.request.content.title || "Notification",
        body: n.request.content.body || "",
        data: n.request.content.data,
        date: n.date
      }))
    );
  }, []);

  useEffect(() => {
    loadNotifications().finally(() => setLoading(false));
  }, [loadNotifications]);

  const { refreshing, onRefresh } = usePullToRefresh(loadNotifications);

  const handleOpen = async (item: NotificationItem) => {
    if (!isExpoGo) {
      try {
        const Notifications = await import("expo-notifications");
        await Notifications.dismissNotificationAsync(item.identifier);
      } catch (err) {
        console.error("Failed to dismiss notification:", err);
      }
    }
    setItems((prev) => prev.filter((i) => i.identifier !== item.identifier));

    const route = getNotificationRoute(item.data);
    if (route) router.push(route);
  };

  const handleClearAll = async () => {
    if (!isExpoGo) {
      try {
        const Notifications = await import("expo-notifications");
        await Notifications.dismissAllNotificationsAsync();
      } catch (err) {
        console.error("Failed to clear notifications:", err);
      }
    }
    setItems([]);
  };

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        subtitle="Tap one to open its screen"
        action={items.length > 0 ? <Button label="Clear All" variant="secondary" compact onPress={handleClearAll} /> : undefined}
      />

      <RefreshableScrollView refreshing={refreshing} onRefresh={onRefresh} contentContainerStyle={{ padding: 16, gap: 14 }}>
        {loading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState title="No Notifications" description="New order, booking, and consultation alerts will appear here." />
        ) : (
          items.map((item) => (
            <TouchableOpacity key={item.identifier} activeOpacity={0.7} onPress={() => handleOpen(item)}>
              <Card className="gap-1">
                <Text className="text-sm font-rubik-bold text-foreground">{item.title}</Text>
                {item.body ? <Text className="text-xs text-ink-body">{item.body}</Text> : null}
                <Text className="text-[10px] text-ink-muted mt-1">{new Date(item.date).toLocaleString()}</Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </RefreshableScrollView>
    </Screen>
  );
}
