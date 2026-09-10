import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import Constants, { ExecutionEnvironment } from "expo-constants";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Single source of truth for "how many notifications are sitting unopened
// in the OS tray" — used by both the home screen's bell badge and the
// dashboard's pull-to-refresh (which has no data of its own to refresh;
// re-checking this is the one genuinely live thing on that screen).
export function useNotificationCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
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
    refresh();
    // Covers a notification arriving while the app is backgrounded/killed,
    // and the admin opening the app from the home screen icon rather than
    // by tapping the notification itself.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  // Covers returning to the home tab after clearing/opening notifications
  // from the /notifications list screen — that screen dismisses items
  // itself, so the badge would otherwise stay stale until the app was next
  // backgrounded and foregrounded.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { count, refresh };
}
