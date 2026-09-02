import React from "react";
import { Text } from "react-native";
import { Card } from "./card";

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="items-center">
      <Text className="text-sm font-rubik-semibold text-foreground">{title}</Text>
      {description ? <Text className="text-xs text-ink-muted mt-1 text-center">{description}</Text> : null}
    </Card>
  );
}
