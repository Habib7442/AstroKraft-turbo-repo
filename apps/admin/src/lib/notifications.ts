import * as Notifications from "expo-notifications";

// Without this, a notification that arrives while the app is open (the
// common case for an admin actively working) is silently swallowed — no
// banner, no sound. This makes it behave like WhatsApp: banner + sound
// regardless of whether the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});
