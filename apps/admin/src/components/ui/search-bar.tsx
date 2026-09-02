import React, { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

interface SearchBarProps {
  placeholder?: string;
  onChangeQuery: (query: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchBar({ placeholder = "Search…", onChangeQuery, debounceMs = 300, className = "" }: SearchBarProps) {
  const [text, setText] = useState("");
  const debounced = useDebouncedValue(text, debounceMs);

  useEffect(() => {
    onChangeQuery(debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <View
      className={`flex-row items-center bg-background border border-surface-border rounded-xl px-3.5 h-11 gap-2 ${className}`}
    >
      <Ionicons name="search-outline" size={16} color="#6E698A" />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#6E698A"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        className="flex-1 text-sm text-ink font-rubik-medium"
      />
      {text.length > 0 ? (
        <Pressable onPress={() => setText("")} hitSlop={8}>
          <Ionicons name="close-circle" size={16} color="#6E698A" />
        </Pressable>
      ) : null}
    </View>
  );
}
