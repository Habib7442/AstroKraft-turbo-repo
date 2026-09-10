import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { getNotificationRoute } from "@/lib/notification-routing";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

interface NotificationBellProps {
  // Owned by the parent screen (useNotificationCount) rather than this
  // component, so the dashboard's pull-to-refresh and this badge share one
  // count instead of drifting out of sync as two independent hook
  // instances each polling the OS tray on their own.
  count: number;
  refresh: () => void;
}

// "Unread" here means "still sitting in the OS notification tray,
// un-dismissed" (Notifications.getPresentedNotificationsAsync) rather than
// app-tracked read/unread state — the tray already IS a reliable, OS-backed
// record of "arrived but not yet opened" that survives the app being
// killed, so there's no need to duplicate it with our own storage.
export function NotificationBell({ count, refresh }: NotificationBellProps) {
  const router = useRouter();

  const handlePress = async () => {
    if (isExpoGo) return;
    try {
      const Notifications = await import("expo-notifications");
      const presented = await Notifications.getPresentedNotificationsAsync();

      if (presented.length === 0) {
        Alert.alert("No New Notifications", "You're all caught up.");
        return;
      }

      // A single pending notification: open its screen directly, same as
      // tapping the OS notification itself would. Multiple: there's no one
      // obvious screen to jump to, so open the list instead of guessing.
      if (presented.length > 1) {
        router.push("/notifications");
        return;
      }

      const [only] = presented;
      const route = getNotificationRoute(only.request.content.data);
      await Notifications.dismissNotificationAsync(only.request.identifier);
      // Re-check rather than assume 0 — this reflects whatever the tray
      // actually holds now, not just what this one dismiss should imply.
      refresh();

      if (route) {
        router.push(route);
      } else {
        // Couldn't tell which screen this belongs to — never leave the tap
        // doing nothing visible. The list screen at least shows the
        // notification's title/body, and reads the same data this just
        // failed to parse, which helps spot what's actually wrong.
        console.error("Could not resolve a route for notification data:", only.request.content.data);
        router.push("/notifications");
      }
    } catch (err) {
      console.error("Failed to open notification:", err);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} className="relative w-9 h-9 items-center justify-center" hitSlop={8}>
      <Ionicons name="notifications-outline" size={22} color="#fff" />
      {count > 0 ? (
        <View className="absolute top-0 right-0 min-w-[16px] h-4 rounded-full bg-destructive items-center justify-center px-1">
          <Text className="text-[10px] font-rubik-bold text-white">{count > 9 ? "9+" : count}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
