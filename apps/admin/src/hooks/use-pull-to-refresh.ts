import { useCallback, useState } from "react";

export function usePullToRefresh(onRefreshAsync: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefreshAsync();
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshAsync]);

  return { refreshing, onRefresh };
}
