import React from "react";
import { FlatList, FlatListProps, RefreshControl } from "react-native";

interface RefreshableFlatListProps<T> extends FlatListProps<T> {
  refreshing: boolean;
  onRefresh: () => void;
}

export function RefreshableFlatList<T>({ refreshing, onRefresh, ...rest }: RefreshableFlatListProps<T>) {
  return (
    <FlatList
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B21B6" colors={["#5B21B6"]} />
      }
      {...rest}
    />
  );
}
