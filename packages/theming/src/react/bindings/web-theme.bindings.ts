/**
 * @file web-theme.bindings.ts
 * @module @stackra/theming/react/bindings
 * @description Web platform adapter implementing IThemeBindings.
 *   Uses localStorage, document.documentElement class manipulation, and
 *   matchMedia for system detection. Includes cross-tab sync via storage events.
 */

import { Injectable } from '@stackra/container';
import type {
  IThemeBindings,
  ColorMode,
  ResolvedMode,
  IDesignTokenMap,
  ISSRScriptOptions,
} from '@stackra/contracts';
import {
  DEFAULT_MODE_STORAGE_KEY,
  DEFAULT_THEME_STORAGE_KEY,
  DEFAULT_THEME_ID,
  THEME_DATA_ATTRIBUTE,
} from '../../core/constants';
import { tokenToCssVar } from '../../core/utils';

// ============================================================================
// Web Bindings
// ============================================================================

/**
 * Web platform adapter implementing IThemeBindings.
 *
 * Uses localStorage for persistence, document.documentElement class
 * for mode application, data-design-theme attribute for named themes,
 * and matchMedia for system color scheme detection.
 */
@Injectable()
export class WebThemeBindings implements IThemeBindings {
  // ── Persistence ─────────────────────────────────────────────────────────

  /**
   * Read the persisted color mode from localStorage.
   *
   * @returns The stored ColorMode or null if not set.
   */
  public getPersistedMode(): ColorMode | null {
    if (typeof window === 'undefined') return null;
    const value = localStorage.getItem(DEFAULT_MODE_STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
    return null;
  }

  /**
   * Persist the color mode to localStorage.
   *
   * @param mode - The color mode to persist.
   */
  public setPersistedMode(mode: ColorMode): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DEFAULT_MODE_STORAGE_KEY, mode);
  }

  /**
   * Read the persisted theme ID from localStorage.
   *
   * @returns The stored theme ID or null if not set.
   */
  public getPersistedTheme(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(DEFAULT_THEME_STORAGE_KEY);
  }

  /**
   * Persist the theme ID to localStorage.
   *
   * @param id - The theme ID to persist.
   */
  public setPersistedTheme(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DEFAULT_THEME_STORAGE_KEY, id);
  }

  // ── System Detection ────────────────────────────────────────────────────

  /**
   * Get the current OS color scheme preference via matchMedia.
   *
   * @returns 'dark' or 'light' based on the OS preference.
   */
  public getSystemColorScheme(): ResolvedMode {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Subscribe to OS color scheme changes via matchMedia.
   *
   * @param listener - Callback invoked when the OS scheme changes.
   * @returns Unsubscribe function.
   */
  public subscribeToSystemChanges(listener: (mode: ResolvedMode) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      listener(e.matches ? 'dark' : 'light');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }

  // ── Application ─────────────────────────────────────────────────────────

  /**
   * Apply the resolved mode to the DOM.
   * Sets class="dark" or class="light" and data-theme on <html>.
   *
   * @param resolvedMode - The computed mode to apply.
   */
  public applyColorMode(resolvedMode: ResolvedMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedMode);
    root.setAttribute('data-theme', resolvedMode);
    root.style.colorScheme = resolvedMode;
  }

  /**
   * Apply design tokens as inline CSS custom properties on <html>.
   * Used for remote/API-driven tokens only — built-in themes use CSS file.
   *
   * @param tokens - Token map to apply.
   */
  public applyTokens(tokens: IDesignTokenMap): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(tokens)) {
      if (value != null) {
        root.style.setProperty(tokenToCssVar(key), value);
      }
    }
  }

  /**
   * Generate the SSR blocking script content.
   * Reads localStorage for mode and theme, applies before React hydrates.
   *
   * @param options - Script generation options.
   * @returns Script content as a string.
   */
  public getSSRScript(options: ISSRScriptOptions = {}): string {
    const modeKey = options.storageKey ?? DEFAULT_MODE_STORAGE_KEY;
    const themeKey = options.themeKey ?? DEFAULT_THEME_STORAGE_KEY;
    const defaultMode = options.defaultMode ?? 'system';

    return `(function(){try{var d=document.documentElement;var m=localStorage.getItem('${modeKey}')||'${defaultMode}';var t=localStorage.getItem('${themeKey}');var r=m;if(m==='system'){r=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}d.classList.add(r);d.setAttribute('data-theme',r);d.style.colorScheme=r;if(t&&t!=='${DEFAULT_THEME_ID}'){d.setAttribute('${THEME_DATA_ATTRIBUTE}',t);}}catch(e){}})();`;
  }
}
