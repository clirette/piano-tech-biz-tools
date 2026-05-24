import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Keep localStorage in sync whenever value changes (covers external updates)
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be full or unavailable
    }
  }, [key, value]);

  // Wrap setter to also persist synchronously so navigations that happen in
  // the same tick (before the effect flushes) see the updated value.
  function setValueAndPersist(next: T | ((prev: T) => T)) {
    setValue(prev => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Storage may be full or unavailable
      }
      return resolved;
    });
  }

  return [value, setValueAndPersist] as const;
}
