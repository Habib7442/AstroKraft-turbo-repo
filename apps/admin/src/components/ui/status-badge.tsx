import React from "react";
import { Text, View } from "react-native";

export type BadgeTone = "primary" | "gold" | "saffron" | "success" | "neutral" | "danger";

const TONE_STYLES: Record<BadgeTone, { container: string; text: string }> = {
  primary: { container: "bg-primary/10 border border-primary/20", text: "text-primary" },
  gold: { container: "bg-gold/10 border border-gold/20", text: "text-gold" },
  saffron: { container: "bg-saffron border border-transparent", text: "text-white" },
  success: { container: "bg-green-100 border border-green-300", text: "text-green-800" },
  neutral: { container: "bg-gray-100 border border-gray-300", text: "text-gray-600" },
  danger: { container: "bg-red-100 border border-red-300", text: "text-red-700" }
};

export function StatusBadge({ label, tone = "primary" }: { label: string; tone?: BadgeTone }) {
  const styles = TONE_STYLES[tone];

  return (
    <View className={`px-2.5 py-1 rounded-full ${styles.container}`}>
      <Text className={`text-[10px] font-rubik-bold uppercase ${styles.text}`}>{label}</Text>
    </View>
  );
}
