import React, { useCallback, useEffect, useState } from "react";
import { Alert, AppState, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { getNotificationRoute } from "@/lib/notification-routing";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// "Unread" here means "still sitting in the OS notification tray,
// un-dismissed" (Notifications.getPresentedNotificationsAsync) rather than
// app-tracked read/unread state — the tray already IS a reliable, OS-backed
// record of "arrived but not yet opened" that survives the app being
// killed, so there's no need to duplicate it with our own storage.
export function NotificationBell() {
  const router = useRouter();
  const [count, setCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (isExpoGo) return;
    try {
      const Notifications = await import("expo-notifications");
      const presented = await Notifications.getPresentedNotificationsAsync();
      setCount(presented.length);
    } catch (err) {
      console.error("Failed to read presented notifications:", err);
    }
  }, []);

  useEffect(() => {
    refreshCount();
    // Covers the common case: a notification arrives while the app is
    // backgrounded/killed, and the admin opens the app from the home
    // screen icon rather than by tapping the notification itself.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshCount();
    });
    return () => subscription.remove();
  }, [refreshCount]);

  // Covers returning to the home tab after clearing/opening notifications
  // from the /notifications list screen — that screen dismisses items
  // itself, so this tab's badge would otherwise stay stale until the app
  // was next backgrounded and foregrounded.
  useFocusEffect(
    useCallback(() => {
      refreshCount();
    }, [refreshCount])
  );

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
      const route = getNotificationRoute(only.request.content.data as Record<string, unknown>);
      await Notifications.dismissNotificationAsync(only.request.identifier);
      setCount(0);

      if (route) router.push(route);
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
