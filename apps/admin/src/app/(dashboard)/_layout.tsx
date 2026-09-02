import { Redirect } from "expo-router";
import { Text, View } from "react-native";
import { useAuth, useClerk } from "@clerk/expo";
import { getRoleFromSessionClaims } from "@astrokraft/auth";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { Button, Screen } from "@/components/ui";

export default function DashboardLayout() {
  const { isSignedIn, sessionClaims } = useAuth();
  const { signOut } = useClerk();

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  const role = getRoleFromSessionClaims(sessionClaims);

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
