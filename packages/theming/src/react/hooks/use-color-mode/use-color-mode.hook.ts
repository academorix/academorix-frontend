/**
 * @file use-color-mode.hook.ts
 * @module @stackra/theming/react/hooks
 * @description Color mode hook with computed boolean flags and toggle.
 */

import { useMemo, useCallback, useSyncExternalStore } from 'react';
import { useInject } from '@stackra/container/react';
import type { ColorMode, ResolvedMode } from '@stackra/contracts';
import { THEME_SERVICE } from '@stackra/contracts';
import { THEME_TOKEN_STORE } from '../../../core/tokens';
import { ThemeService } from '../../../core/services/theme.service';
import { ThemeTokenStore } from '../../../core/stores/theme-token.store';

// ============================================================================
// Types
// ============================================================================

/**
 * Return shape of `useColorMode()`.
 */
export interface UseColorModeReturn {
  /** The user-selected color mode. */
  readonly mode: ColorMode;
  /** Change the color mode. */
  readonly setMode: (mode: ColorMode) => void;
  /** The resolved effective mode after 'system' resolution. */
  readonly resolvedMode: ResolvedMode;
  /** Convenience flag — `resolvedMode === 'dark'`. */
  readonly isDark: boolean;
  /** Convenience flag — `resolvedMode === 'light'`. */
  readonly isLight: boolean;
  /** Convenience flag — the user picked 'system'. */
  readonly isSystem: boolean;
  /** Toggle between light and dark, skipping 'system'. */
  readonly toggle: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Color mode hook with computed boolean flags and toggle.
 *
 * @returns Color mode state, flags, and control methods.
 */
export function useColorMode(): UseColorModeReturn {
  const service = useInject<ThemeService>(THEME_SERVICE);
  const store = useInject<ThemeTokenStore>(THEME_TOKEN_STORE);

  const state = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getState(),
    () => store.getState()
  );

  const setMode = useCallback((mode: ColorMode) => service.setMode(mode), [service]);

  const toggle = useCallback(() => {
    const newMode = state.resolvedMode === 'dark' ? 'light' : 'dark';
    service.setMode(newMode);
  }, [service, state.resolvedMode]);

  return useMemo(
    () => ({
      mode: state.mode,
      setMode,
      resolvedMode: state.resolvedMode,
      isDark: state.resolvedMode === 'dark',
      isLight: state.resolvedMode === 'light',
      isSystem: state.mode === 'system',
      toggle,
    }),
    [state.mode, state.resolvedMode, setMode, toggle]
  );
}
