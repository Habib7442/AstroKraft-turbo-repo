import React from "react";
import { RefreshControl, ScrollView, ScrollViewProps } from "react-native";

interface RefreshableScrollViewProps extends ScrollViewProps {
  refreshing: boolean;
  onRefresh: () => void;
}

export function RefreshableScrollView({ refreshing, onRefresh, children, ...rest }: RefreshableScrollViewProps) {
  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B21B6" colors={["#5B21B6"]} />
      }
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
