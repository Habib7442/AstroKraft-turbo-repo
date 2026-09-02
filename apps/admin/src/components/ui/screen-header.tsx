import React, { ReactNode } from "react";
import { Text, View } from "react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export function ScreenHeader({ title, subtitle, action, children }: ScreenHeaderProps) {
  return (
    <View className="px-5 py-4 bg-[#1B1030] border-b border-white/10">
      <View className="flex-row justify-between items-center">
        <View className="flex-1 pr-3">
          <Text className="text-xl font-rubik-bold text-white">{title}</Text>
          {subtitle ? <Text className="text-xs text-white/70 mt-0.5">{subtitle}</Text> : null}
        </View>
        {action}
      </View>
      {children ? <View className="mt-3">{children}</View> : null}
    </View>
  );
}
