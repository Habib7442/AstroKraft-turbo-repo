import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface FilterPillsProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  scroll?: boolean;
}

export function FilterPills<T extends string>({ options, value, onChange, scroll }: FilterPillsProps<T>) {
  const pills = options.map((option) => {
    const active = option === value;
    return (
      <TouchableOpacity
        key={option}
        onPress={() => onChange(option)}
        className={`px-3 py-1.5 rounded-full border ${active ? "bg-primary border-primary" : "bg-background border-surface-border"}`}
      >
        <Text className={`text-xs font-rubik-semibold ${active ? "text-white" : "text-ink-body"}`}>{option.toUpperCase()}</Text>
      </TouchableOpacity>
    );
  });

  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {pills}
      </ScrollView>
    );
  }

  return <View className="flex-row flex-wrap gap-2">{pills}</View>;
}
