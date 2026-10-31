import { ConvexError } from "convex/values";
import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";

export function errorMessage(err: unknown) {
  if (err instanceof ConvexError && typeof err.data === "string") return err.data;
  return "Something went wrong. Please try again.";
}

export async function copyText(text: string, what = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(what);
  } catch {
    toast.error("Could not copy. Select the text and copy it by hand.");
  }
}

// localStorage that never throws (private mode, blocked storage).
export const storage = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {}
  },
};

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

// A string kept in localStorage. Undefined until the browser has read it (server render, hydration).
export function useStoredString(key: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => storage.get(key),
    () => undefined,
  );
  const setValue = useCallback(
    (next: string | null) => {
      storage.set(key, next);
      listeners.forEach((fn) => fn());
    },
    [key],
  );
  return [value, setValue] as const;
}
