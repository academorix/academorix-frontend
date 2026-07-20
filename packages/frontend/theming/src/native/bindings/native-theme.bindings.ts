/**
 * @file native-theme.bindings.ts
 * @module @stackra/theming/native/bindings
 * @description Native platform adapter implementing IThemeBindings.
 *   Uses AsyncStorage for persistence and the Appearance API for system detection.
 *   Caches values in memory after initialization since AsyncStorage is async.
 */

import { Injectable } from "@stackra/container";
import type {
  IThemeBindings,
  ColorMode,
  ResolvedMode,
  IDesignTokenMap,
  ISSRScriptOptions,
} from "@stackra/contracts";
import { DEFAULT_MODE_STORAGE_KEY, DEFAULT_THEME_STORAGE_KEY } from "../../core/constants";

// ============================================================================
// Native Bindings
// ============================================================================

/**
 * Native platform adapter implementing IThemeBindings.
 *
 * Uses AsyncStorage for persistence and the React Native Appearance API
 * for system color scheme detection. Caches values in memory after
 * initialization since AsyncStorage is async.
 */
@Injectable()
export class NativeThemeBindings implements IThemeBindings {
  /** In-memory cache for persisted mode (populated from AsyncStorage). */
  private cachedMode: ColorMode | null = null;

  /** In-memory cache for persisted theme (populated from AsyncStorage). */
  private cachedTheme: string | null = null;

  // ── Persistence ─────────────────────────────────────────────────────────

  /**
   * Read the persisted color mode from in-memory cache.
   * AsyncStorage is async so values are pre-loaded.
   *
   * @returns The cached ColorMode or null.
   */
  public getPersistedMode(): ColorMode | null {
    return this.cachedMode;
  }

  /**
   * Persist the color mode to AsyncStorage and update cache.
   *
   * @param mode - The color mode to persist.
   */
  public setPersistedMode(mode: ColorMode): void {
    this.cachedMode = mode;
    this.asyncSetItem(DEFAULT_MODE_STORAGE_KEY, mode);
  }

  /**
   * Read the persisted theme ID from in-memory cache.
   *
   * @returns The cached theme ID or null.
   */
  public getPersistedTheme(): string | null {
    return this.cachedTheme;
  }

  /**
   * Persist the theme ID to AsyncStorage and update cache.
   *
   * @param id - The theme ID to persist.
   */
  public setPersistedTheme(id: string): void {
    this.cachedTheme = id;
    this.asyncSetItem(DEFAULT_THEME_STORAGE_KEY, id);
  }

  // ── System Detection ────────────────────────────────────────────────────

  /**
   * Get the current OS color scheme via Appearance API.
   *
   * @returns 'dark' or 'light'.
   */
  public getSystemColorScheme(): ResolvedMode {
    try {
      // Dynamic import to avoid errors in non-RN environments
      const { Appearance } = require("react-native");
      return Appearance.getColorScheme() === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  }

  /**
   * Subscribe to OS color scheme changes via Appearance listener.
   *
   * @param listener - Callback invoked on scheme change.
   * @returns Unsubscribe function.
   */
  public subscribeToSystemChanges(listener: (mode: ResolvedMode) => void): () => void {
    try {
      const { Appearance } = require("react-native");
      const subscription = Appearance.addChangeListener(
        ({ colorScheme }: { colorScheme: string | null | undefined }) => {
          listener(colorScheme === "dark" ? "dark" : "light");
        },
      );
      return () => subscription.remove();
    } catch {
      return () => {};
    }
  }

  // ── Application ─────────────────────────────────────────────────────────

  /**
   * Apply the resolved mode. On native this is typically a no-op
   * since Uniwind/theme context handles it.
   *
   * @param _resolvedMode - The computed mode.
   */
  public applyColorMode(_resolvedMode: ResolvedMode): void {
    // Native theming is handled by the NativeThemeProvider context
  }

  /**
   * Apply design tokens. On native, tokens are passed via context.
   *
   * @param _tokens - Token map (handled by provider context).
   */
  public applyTokens(_tokens: IDesignTokenMap): void {
    // Native tokens are applied via NativeThemeProvider context
  }

  /**
   * SSR script is not applicable on native. Returns empty string.
   *
   * @param _options - Ignored on native.
   * @returns Empty string.
   */
  public getSSRScript(_options: ISSRScriptOptions): string {
    return "";
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Async write to AsyncStorage (fire-and-forget).
   *
   * @param key - Storage key.
   * @param value - Value to store.
   */
  private asyncSetItem(key: string, value: string): void {
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      AsyncStorage.setItem(key, value).catch(() => {});
    } catch {
      // AsyncStorage not available
    }
  }
}
