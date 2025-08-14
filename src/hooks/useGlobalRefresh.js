// src/hooks/useGlobalRefresh.js
import { useCallback, useState } from 'react';

export default function useGlobalRefresh(refreshCallback) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCallback?.();  // call whatever refresh logic you pass
    setRefreshing(false);
  }, [refreshCallback]);

  return { refreshing, onRefresh };
}
