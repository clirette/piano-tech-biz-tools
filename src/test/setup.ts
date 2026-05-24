import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// ---- Node 26 + jsdom compatibility polyfills ----
//
// Node 26 exposes an experimental `localStorage` global (configurable getter) that returns
// `undefined` unless --localstorage-file is provided. When vitest creates the jsdom vm context
// this getter can shadow jsdom's own localStorage. We replace it unconditionally with an
// in-memory implementation so all tests get a working Storage object.

function makeStorageMock() {
  const store = new Map<string, string>();
  return {
    get length() { return store.size; },
    clear() { store.clear(); },
    getItem(key: string) { return store.get(key) ?? null; },
    setItem(key: string, value: string) { store.set(key, String(value)); },
    removeItem(key: string) { store.delete(key); },
    key(index: number) { return [...store.keys()][index] ?? null; },
  };
}

Object.defineProperty(globalThis, 'localStorage', {
  value: makeStorageMock(),
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: makeStorageMock(),
  configurable: true,
  writable: true,
});

// jsdom does not implement matchMedia; provide a no-op stub.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
    writable: true,
    configurable: true,
  });
}

afterEach(cleanup);
