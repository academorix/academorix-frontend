/**
 * @file ssr-script-options.interface.ts
 * @module @stackra/contracts/interfaces/theming
 * @description Options for the theming SSR blocking script (flash-of-wrong-
 *   theme prevention).
 */

/** Options for the theming SSR blocking `<script>`. */
export interface ISSRScriptOptions {
  /** Storage key for the persisted color mode. */
  modeStorageKey?: string;
  /** Alias of {@link modeStorageKey}. */
  storageKey?: string;
  /** Storage key for the persisted theme id. */
  themeStorageKey?: string;
  /** Alias of {@link themeStorageKey}. */
  themeKey?: string;
  /** Data attribute name written on `<html>` for the theme (default: `data-design-theme`). */
  dataAttribute?: string;
  /** Default mode when no preference is persisted. */
  defaultMode?: string;
  /** Default theme id when no preference is persisted. */
  defaultTheme?: string;
}
