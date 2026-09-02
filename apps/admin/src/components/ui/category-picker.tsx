import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";

export interface CategoryPickerOption {
  id: string;
  label: string;
}

interface CategoryPickerProps {
  options: CategoryPickerOption[];
  value: string | null;
  onChange: (id: string) => void;
}

export function CategoryPicker({ options, value, onChange }: CategoryPickerProps) {
  if (options.length === 0) {
    return <Text className="text-xs text-ink-muted">No categories yet — create one from the Categories tab first.</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => onChange(option.id)}
            className={`px-3 py-1.5 rounded-full border ${active ? "bg-primary border-primary" : "bg-background border-surface-border"}`}
          >
            <Text className={`text-xs font-rubik-semibold ${active ? "text-white" : "text-ink-body"}`}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
