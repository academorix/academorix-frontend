/**
 * @file theme-bindings.interface.ts
 * @module @stackra/contracts/interfaces/theming
 * @description Platform-adapter contract for the theming subsystem.
 *
 *   Implemented by `WebThemeBindings` (DOM + `matchMedia` + localStorage)
 *   and `NativeThemeBindings` (React Native `Appearance` + AsyncStorage).
 *   Feature packages inject `THEME_BINDINGS` and depend only on this
 *   shape, so the same orchestrator runs unchanged on both platforms.
 */

import type { ColorMode } from "./color-mode.type";
import type { ResolvedMode } from "./resolved-mode.type";
import type { IDesignTokenMap } from "./design-token-map.interface";
import type { ISSRScriptOptions } from "./ssr-script-options.interface";

/**
 * Platform-specific theme adapter contract.
 */
export interface IThemeBindings {
  /** Get the current OS color-scheme preference. */
  getSystemColorScheme(): ResolvedMode;
  /** Apply a resolved mode to the platform (DOM class / RN theme provider). */
  applyColorMode(mode: ResolvedMode): void;
  /** Apply design tokens to the platform (CSS vars / RN StyleSheet). */
  applyTokens(tokens: IDesignTokenMap): void;
  /** Persist the user's color mode preference. */
  setPersistedMode(mode: ColorMode): void;
  /** Persist the user's theme id preference. */
  setPersistedTheme(themeId: string): void;
  /** Read the persisted color mode preference (sync — bindings cache). */
  getPersistedMode(): ColorMode | null;
  /** Read the persisted theme id preference (sync — bindings cache). */
  getPersistedTheme(): string | null;
  /** Subscribe to OS color-scheme changes. Returns an unsubscribe. */
  subscribeToSystemChanges(callback: (mode: ResolvedMode) => void): () => void;
  /** Optional: emit the SSR blocking `<script>` body for flash-prevention. */
  getSSRScript?(options?: ISSRScriptOptions): string;
}
