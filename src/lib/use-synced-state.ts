import { useEffect, useRef, useState } from "react";

export function useSyncedState<T>(value: unknown, initializer: () => T) {
  const [state, setState] = useState<T>(initializer);
  const previousValue = useRef(value);
  const initializerRef = useRef(initializer);

  useEffect(() => {
    initializerRef.current = initializer;
  }, [initializer]);

  useEffect(() => {
    if (previousValue.current !== value) {
      previousValue.current = value;
      setState(initializerRef.current());
    }
  }, [value]);

  return [state, setState] as const;
}
