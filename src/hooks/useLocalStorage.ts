import { useState, useEffect, useRef } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Always holds the latest committed value so setValueAndPersist can read it
  // synchronously without relying on a potentially-stale closure.
  const valueRef = useRef(value);
  valueRef.current = value;

  // Keep localStorage in sync whenever value changes (covers external updates)
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be full or unavailable
    }
  }, [key, value]);

  // Compute and persist the new value synchronously so that navigations
  // triggered in the same event handler see the updated localStorage before
  // the new route's component initialises its own state from storage.
  function setValueAndPersist(next: T | ((prev: T) => T)) {
    const resolved = typeof next === 'function' ? (next as (p: T) => T)(valueRef.current) : next;
    try {
      localStorage.setItem(key, JSON.stringify(resolved));
    } catch {
      // Storage may be full or unavailable
    }
    setValue(resolved);
  }

  return [value, setValueAndPersist] as const;
}
