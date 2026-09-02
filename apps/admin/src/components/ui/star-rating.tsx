import React from "react";
import { Text } from "react-native";

export function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <Text className="text-sm font-rubik-bold text-gold">
      {"★".repeat(rating)}
      {"☆".repeat(Math.max(max - rating, 0))}
    </Text>
  );
}
