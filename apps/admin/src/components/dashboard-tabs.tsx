import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export function DashboardTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#E2C27A",
        tabBarInactiveTintColor: "rgba(255,255,255,0.55)",
        tabBarStyle: {
          backgroundColor: "#1B1030",
          borderTopColor: "rgba(255,255,255,0.08)",
          paddingBottom: 6,
          paddingTop: 6,
          height: 60
        },
        tabBarLabelStyle: {
          fontFamily: "Rubik-Medium",
          fontSize: 11
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: "Catalog",
          tabBarIcon: ({ color, size }) => <Ionicons name="diamond-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="banners"
        options={{
          title: "Banners",
          tabBarIcon: ({ color, size }) => <Ionicons name="megaphone-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-handle-outline" size={size} color={color} />
        }}
      />
      {/* Reachable from the Dashboard's link list, not shown as a tab — the bar is already full. */}
      <Tabs.Screen name="astrologers" options={{ href: null }} />
      <Tabs.Screen name="consultation-categories" options={{ href: null }} />
      <Tabs.Screen name="consultations" options={{ href: null }} />
      {/* Reachable only by tapping an order card — not a tab destination. */}
      <Tabs.Screen name="order-detail" options={{ href: null }} />
    </Tabs>
  );
}
