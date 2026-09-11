import { useEffect } from "react";
import { useRouter } from "expo-router";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { getNotificationRoute } from "@/lib/notification-routing";

// Makes tapping a push notification open the screen it's actually about
// (e.g. the purohit-bookings list for a "New Purohit Booking" push) instead
// of always landing on the dashboard home screen, which is expo-router's
// default behavior for a cold start / background→foreground app launch.
//
// Same Expo-Go-safety constraint as use-register-push-token.ts and
// lib/notifications.ts: expo-notifications must never be statically
// imported, only ever via a dynamic import() gated behind the
// ExecutionEnvironment check, because merely importing it crashes Expo Go
// on Android (SDK 53 removed remote push support there).
export function useNotificationRouting() {
  const router = useRouter();

  useEffect(() => {
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;

    let subscription: { remove: () => void } | undefined;
    let cancelled = false;

    async function setup() {
      const Notifications = await import("expo-notifications");

      const navigate = (data: unknown) => {
        const route = getNotificationRoute(data);
        if (route) {
          router.push(route);
        } else {
          // Falling through to expo-router's default (the dashboard home)
          // is an acceptable fallback here — unlike the bell, tapping the
          // OS notification already opens the app either way. Still log it:
          // this only happens if the data shape didn't match what
          // getNotificationRoute expects, which is worth knowing about.
          console.error("Could not resolve a route for notification data");
        }
      };

      // Covers the app being cold-started by tapping a notification (the
      // process wasn't running yet, so no listener below could have caught
      // the tap that launched it). getLastNotificationResponseAsync keeps
      // returning the SAME response on every future cold start until it's
      // explicitly cleared — without clearing it, every later plain app
      // open (tapping the home screen icon, not a notification) would
      // incorrectly re-navigate to whatever screen that old notification
      // pointed at.
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        await Notifications.clearLastNotificationResponseAsync();
        if (!cancelled) navigate(lastResponse.notification.request.content.data);
      }

      // Covers the app already being alive in the background and the user
      // tapping a notification to bring it to the foreground. Registration
      // happens after several awaits above, so the effect's cleanup could
      // already have run by now (e.g. a sign-out/sign-in cycle remounting
      // this layout) — guard against registering (and thus leaking) a
      // listener that calls router.push through an unmounted layout's
      // stale router and is never removed.
      if (cancelled) return;
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        navigate(response.notification.request.content.data);
      });
      if (cancelled) {
        subscription.remove();
        subscription = undefined;
      }
    }

    setup().catch((err) => console.error("Notification routing setup failed:", err));

    return () => {
      cancelled = true;
      subscription?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
