import React from "react";
import { ActivityIndicator, Pressable, PressableProps, Text } from "react-native";

export type ButtonVariant = "primary" | "secondary" | "success" | "destructive" | "dangerSoft";

const VARIANT_STYLES: Record<ButtonVariant, { container: string; label: string; spinner: string }> = {
  primary: { container: "bg-primary", label: "text-white", spinner: "#FFFFFF" },
  secondary: { container: "bg-surface-muted border border-surface-border", label: "text-primary", spinner: "#5B21B6" },
  success: { container: "bg-green-700", label: "text-white", spinner: "#FFFFFF" },
  destructive: { container: "bg-red-700", label: "text-white", spinner: "#FFFFFF" },
  dangerSoft: { container: "bg-red-50 border border-red-200", label: "text-red-700", spinner: "#B91C1C" }
};

interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  flex?: boolean;
  compact?: boolean;
  className?: string;
}

export function Button({
  label,
  variant = "primary",
  loading,
  flex,
  compact,
  disabled,
  className = "",
  ...rest
}: ButtonProps) {
  const styles = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;
  const sizeClasses = compact ? "px-3.5 py-1.5 rounded-lg" : "py-3 rounded-xl";
  const textSize = compact ? "text-xs" : "text-sm";

  return (
    <Pressable
      disabled={isDisabled}
      className={`${styles.container} ${sizeClasses} items-center justify-center ${flex ? "flex-1" : ""} ${
        isDisabled ? "opacity-60" : ""
      } ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={styles.spinner} />
      ) : (
        <Text className={`font-rubik-bold ${textSize} ${styles.label}`}>{label}</Text>
      )}
    </Pressable>
  );
}
