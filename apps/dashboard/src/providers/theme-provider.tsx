/**
 * @file theme-provider.tsx
 * @module providers/theme-provider
 *
 * @description
 * React glue for the theme controller. Owns mode state, paints `<html>`,
 * persists selections, and re-resolves the `system` appearance via
 * {@link useSyncExternalStore} so we never call `setState` inside an effect
 * just to track the OS query.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import type { ReactNode } from "react";

import type { ResolvedThemeMode, ThemeMode, ThemeToken } from "@/lib/theme";

import {
  applyTheme,
  detectSystemAppearance,
  readStoredMode,
  toThemeToken,
  writeStoredMode,
} from "@/lib/theme-utils";

export type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  token: ThemeToken;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribeToOsAppearance(callback: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }

  const query = window.matchMedia("(prefers-color-scheme: dark)");

  query.addEventListener("change", callback);

  return () => query.removeEventListener("change", callback);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);

  const osAppearance = useSyncExternalStore<ResolvedThemeMode>(
    subscribeToOsAppearance,
    detectSystemAppearance,
    () => "light",
  );

  const resolvedMode: ResolvedThemeMode = mode === "system" ? osAppearance : mode;
  const token = toThemeToken(mode);

  useEffect(() => {
    applyTheme(token);
  }, [token]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    writeStoredMode(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedMode, token, setMode }),
    [mode, resolvedMode, token, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);

  if (!ctx) throw new Error("useTheme must be used inside a <ThemeProvider>.");

  return ctx;
}
