import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useUser, useClerk } from "@clerk/expo";
import { Button, Screen } from "@/components/ui";

const WORKING_SCREENS = [
  {
    href: "/catalog",
    emoji: "💎",
    title: "Catalog & Inventory",
    description: "Gemstones, Rudraksha, Vastu & carats"
  },
  {
    href: "/categories",
    emoji: "🗂️",
    title: "Categories",
    description: "Organize products for browsing"
  },
  {
    href: "/banners",
    emoji: "📢",
    title: "Banners",
    description: "Promo banners with links & positions"
  },
  {
    href: "/orders",
    emoji: "📦",
    title: "Orders",
    description: "Paid → Shipped → Delivered"
  }
] as const;

const NEW_SCREENS = [
  {
    href: "/consultations",
    emoji: "📅",
    title: "Consultations",
    description: "Bookings, birth details & schedule"
  },
  {
    href: "/consultation-categories",
    emoji: "🔯",
    title: "Consultation Categories",
    description: "Career, Love, Finance, Health & more"
  },
  {
    href: "/astrologers",
    emoji: "🔮",
    title: "Astrologers",
    description: "Consultants & their expertise"
  }
] as const;

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Master Admin";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Screen>
      <View className="bg-[#1B1030] px-5 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Image source={require("../../../assets/logo.png")} style={{ width: 30, height: 30, resizeMode: "contain" }} />
          <Text className="text-lg font-rubik-bold text-white tracking-tight">AstroKraft</Text>
        </View>
        <Button label="Sign Out" variant="secondary" compact onPress={handleSignOut} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <View className="bg-surface-card border border-surface-border rounded-2xl p-4 shadow-sm flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
            <Text className="text-lg font-rubik-bold text-white">{initial}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-rubik-semibold text-ink-muted uppercase tracking-wide">Logged in Admin</Text>
            <Text className="text-base font-rubik-bold text-foreground mt-0.5" numberOfLines={1}>
              {displayName}
            </Text>
            <Text className="text-xs text-ink-body">
              Role: <Text className="font-rubik-semibold text-primary">Admin</Text> • Silchar Hub
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-sm font-rubik-bold text-foreground">Management</Text>
          <View className="flex-row flex-wrap justify-between" style={{ rowGap: 12 }}>
            {WORKING_SCREENS.map((action) => (
              <TouchableOpacity
                key={action.href}
                onPress={() => router.push(action.href)}
                style={{ width: "48%" }}
                className="bg-surface-card border border-surface-border rounded-2xl p-4 shadow-sm gap-2"
              >
                <View className="flex-row items-center justify-between">
                  <View className="w-11 h-11 rounded-full bg-primary/10 items-center justify-center">
                    <Text className="text-xl">{action.emoji}</Text>
                  </View>
                  <Text className="text-base font-rubik-bold text-primary">→</Text>
                </View>
                <Text className="text-sm font-rubik-bold text-foreground" numberOfLines={2}>
                  {action.title}
                </Text>
                <Text className="text-[11px] text-ink-body" numberOfLines={2}>
                  {action.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-sm font-rubik-bold text-foreground">Consultations</Text>
          <View className="flex-row flex-wrap justify-between" style={{ rowGap: 12 }}>
            {NEW_SCREENS.map((action) => (
              <TouchableOpacity
                key={action.href}
                onPress={() => router.push(action.href)}
                style={{ width: "48%" }}
                className="bg-surface-card border border-gold/40 rounded-2xl p-4 shadow-sm gap-2"
              >
                <View className="flex-row items-center justify-between">
                  <View className="w-11 h-11 rounded-full bg-gold/15 items-center justify-center">
                    <Text className="text-xl">{action.emoji}</Text>
                  </View>
                  <Text className="text-base font-rubik-bold text-gold">→</Text>
                </View>
                <Text className="text-sm font-rubik-bold text-foreground" numberOfLines={2}>
                  {action.title}
                </Text>
                <Text className="text-[11px] text-ink-body" numberOfLines={2}>
                  {action.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
