/**
 * @file use-theme.hook.ts
 * @module @academorix/dashboard/hooks/use-theme
 * @description React binding for {@link ThemeService}.
 *
 *   Reads the current snapshot via `useSyncExternalStore` so React only
 *   re-renders when the underlying theme actually changes, and exposes the
 *   same shape the legacy `<ThemeProvider>` context used to publish —
 *   consumers who imported `useTheme` from `@/providers/theme-provider`
 *   swap the import path with no other change.
 */

import { useSyncExternalStore } from "react";

import { useInject } from "@stackra/container/react";

import type { ResolvedThemeMode, ThemeMode, ThemeToken } from "@/lib/theme";

import { ThemeService } from "@/services/theme";
import { THEME_SERVICE } from "@/tokens/theme-service.token";

/**
 * Snapshot + mutator surface returned by {@link useTheme}. Mirrors the
 * shape of the legacy `ThemeContextValue` so the migration is drop-in for
 * every existing caller.
 */
export interface UseThemeResult {
  /** The user's selected mode. */
  mode: ThemeMode;
  /** `mode` resolved through the OS query (never `"system"`). */
  resolvedMode: ResolvedThemeMode;
  /** The `data-theme` token applied to `<html>`. */
  token: ThemeToken;
  /** Update the mode. Persists + re-paints. */
  setMode: (mode: ThemeMode) => void;
}

/**
 * Reads the active theme snapshot from the DI-owned {@link ThemeService}.
 *
 * Rendering behaviour: `useSyncExternalStore` subscribes to the service's
 * reactive store, so a mode change queues a single React re-render that
 * commits the new snapshot atomically — no double render, no stale value
 * during suspense transitions.
 *
 * @returns Current snapshot + `setMode` mutator.
 *
 * @example
 * ```tsx
 * function ModeMenu() {
 *   const { mode, setMode } = useTheme();
 *   return (
 *     <Select value={mode} onChange={setMode}>
 *       <SelectItem value="light">Light</SelectItem>
 *       <SelectItem value="dark">Dark</SelectItem>
 *       <SelectItem value="system">System</SelectItem>
 *     </Select>
 *   );
 * }
 * ```
 */
export function useTheme(): UseThemeResult {
  const service = useInject<ThemeService>(THEME_SERVICE);
  const snapshot = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);

  return {
    mode: snapshot.mode,
    resolvedMode: snapshot.resolvedMode,
    token: snapshot.token,
    setMode: service.setMode,
  };
}
