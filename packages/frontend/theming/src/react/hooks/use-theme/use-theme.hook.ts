/**
 * @file use-theme.hook.ts
 * @module @stackra/theming/react/hooks
 * @description Full theming API hook. Returns the current theme state and mutation methods.
 */

import { useMemo, useCallback, useSyncExternalStore } from "react";
import { useInject } from "@stackra/container/react";
import type { IDesignTokenMap, ColorMode } from "@stackra/contracts";
import { THEME_SERVICE, THEME_REGISTRY } from "@stackra/contracts";
import { THEME_TOKEN_STORE } from "../../../core/tokens";
import { ThemeService } from "../../../core/services/theme.service";
import { ThemeRegistry } from "../../../core/registries/theme.registry";
import { ThemeTokenStore } from "../../../core/stores/theme-token.store";
// ============================================================================
// Types
// ============================================================================

/**
 * Return shape of the `useTheme()` hook.
 */
export interface UseThemeReturn {
  /** The active theme identifier. */
  readonly themeId: string;
  /** Switch to a different registered theme. */
  readonly setTheme: (id: string) => void;
  /** The user-selected color mode. */
  readonly mode: ColorMode;
  /** Switch color mode ('light' / 'dark' / 'system'). */
  readonly setMode: (mode: ColorMode) => void;
  /** The resolved effective mode after applying 'system' resolution. */
  readonly resolvedMode: "light" | "dark";
  /** Design tokens active for the current theme (server-hydrated only). */
  readonly tokens: IDesignTokenMap;
  /** The shared theme registry — read-only handle for enumeration. */
  readonly registry: ThemeRegistry;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Full theming API hook.
 *
 * Returns the current theme state and mutation methods.
 * Works on both web and native via the bindings pattern.
 *
 * @returns Theme state and control methods.
 */
export function useTheme(): UseThemeReturn {
  const service = useInject<ThemeService>(THEME_SERVICE);
  const registry = useInject<ThemeRegistry>(THEME_REGISTRY);
  const store = useInject<ThemeTokenStore>(THEME_TOKEN_STORE);

  const state = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getState(),
    () => store.getState(),
  );

  const setTheme = useCallback((id: string) => service.setTheme(id), [service]);
  const setMode = useCallback((mode: ColorMode) => service.setMode(mode), [service]);

  return useMemo(
    () => ({
      themeId: state.themeId,
      setTheme,
      mode: state.mode,
      setMode,
      resolvedMode: state.resolvedMode,
      tokens: state.tokens,
      registry,
    }),
    [state, setTheme, setMode, registry],
  );
}
