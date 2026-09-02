import React from "react";
import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className = "", ...rest }: CardProps) {
  return (
    <View className={`bg-surface-card border border-surface-border rounded-xl p-4 shadow-sm ${className}`} {...rest} />
  );
}
