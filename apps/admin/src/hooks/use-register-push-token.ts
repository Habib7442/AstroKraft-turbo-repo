import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useUser } from "@clerk/expo";
import { useSupabase } from "@/lib/supabase";

// Registers this device for push notifications and upserts its Expo push
// token into the push_tokens table so the web app's order/consultation
// webhooks can notify every admin device. Depends only on the primitive
// user.id, not on `supabase` — useSupabase() re-memoizes every render
// (Clerk's getToken isn't referentially stable), so depending on it here
// would re-run registration on every render.
export function useRegisterPushToken() {
  const { user } = useUser();
  const supabase = useSupabase();

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function register() {
      if (!Device.isDevice) return; // push tokens require a physical device

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          sound: "default",
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#E2C27A"
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return;

      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      if (cancelled || !tokenResponse?.data || !user?.id) return;

      const { error } = await supabase
        .from("push_tokens")
        .upsert({ user_id: user.id, token: tokenResponse.data, platform: Platform.OS }, { onConflict: "token" });
      if (error) console.error("Failed to save push token:", error);
    }

    register().catch((err) => console.error("Push token registration failed:", err));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
}
