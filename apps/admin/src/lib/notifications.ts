import Constants, { ExecutionEnvironment } from "expo-constants";

// Without this, a notification that arrives while the app is open (the
// common case for an admin actively working) is silently swallowed — no
// banner, no sound. This makes it behave like WhatsApp: banner + sound
// regardless of whether the app is foregrounded.
//
// expo-notifications' Android remote push support was removed from Expo Go
// in SDK 53 — merely IMPORTING the module (not just calling into it) throws,
// because it runs auto-registration side effects at import time. So the
// Expo Go check must happen before the module is ever imported below, and
// the import itself has to be dynamic rather than static.
export async function setupNotificationHandler() {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;

  const Notifications = await import("expo-notifications");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false
    })
  });
}
