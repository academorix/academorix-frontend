/**
 * @fileoverview isMac — detect macOS for keyboard combo translation.
 *
 * @module @stackra/kbd
 * @category Utils
 */

/**
 * Detect macOS at runtime.
 *
 * Used by {@link matchCombo} to translate `mod` into `meta` (Cmd) on
 * Mac and `ctrl` elsewhere. SSR-safe: returns `false` on the server.
 */
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.userAgent || navigator.platform || "";
  return /Mac|iPod|iPhone|iPad/.test(platform);
}
