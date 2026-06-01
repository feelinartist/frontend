import { useState } from "react";

export function useLoadingState(onLoadingChange?: (loading: boolean) => void) {
  const [loading, setLoading] = useState(false);

  const setGlobalLoading = (isLoading: boolean) => {
    setLoading(isLoading);
    onLoadingChange?.(isLoading);
  };

  return [loading, setGlobalLoading] as const;
}
