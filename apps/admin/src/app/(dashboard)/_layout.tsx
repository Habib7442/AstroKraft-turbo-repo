import { Redirect } from "expo-router";
import { Text, View } from "react-native";
import { useAuth, useClerk } from "@clerk/expo";
import { getRoleFromSessionClaims } from "@astrokraft/auth";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { Button, Screen } from "@/components/ui";
import { useRegisterPushToken } from "@/hooks/use-register-push-token";

export default function DashboardLayout() {
  const { isSignedIn, sessionClaims } = useAuth();
  const { signOut } = useClerk();
  const role = getRoleFromSessionClaims(sessionClaims);

  // Registers this device's push token whenever a confirmed admin has the
  // dashboard mounted — hooks must run unconditionally, so this sits above
  // the early-return guards below and no-ops internally until isSignedIn
  // && role === "admin" (the hook itself checks user?.id, which is only
  // set once signed in).
  useRegisterPushToken();

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  if (role !== "admin") {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8 gap-3">
          <Text className="text-lg font-rubik-bold text-foreground text-center">Access Restricted</Text>
          <Text className="text-sm text-ink-body text-center">
            This account is not authorized for the AstroKraft admin app. Contact an administrator if you believe
            this is a mistake.
          </Text>
          <Button label="Sign Out" variant="secondary" onPress={() => signOut()} className="mt-4" />
        </View>
      </Screen>
    );
  }

  return <DashboardTabs />;
}
