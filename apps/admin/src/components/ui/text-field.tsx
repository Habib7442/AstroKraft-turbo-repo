import React, { useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TextFieldProps extends TextInputProps {
  label?: string;
  className?: string;
  isPassword?: boolean;
}

export function TextField({ label, className = "", isPassword, secureTextEntry, ...rest }: TextFieldProps) {
  const [visible, setVisible] = useState(false);
  const hideText = isPassword ? !visible : secureTextEntry;

  return (
    <View>
      {label ? <Text className="text-xs font-rubik-semibold text-ink-body mb-1">{label}</Text> : null}
      <View className="justify-center">
        <TextInput
          placeholderTextColor="#6E698A"
          secureTextEntry={hideText}
          className={`bg-background border border-surface-border px-4 py-3 rounded-xl text-ink text-sm ${
            isPassword ? "pr-12" : ""
          } ${className}`}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            className="absolute right-3"
          >
            <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={18} color="#6E698A" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
