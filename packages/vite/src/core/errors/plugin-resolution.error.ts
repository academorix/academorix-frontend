/**
 * @file plugin-resolution.error.ts
 * @module @stackra/vite/core/errors
 * @description Thrown when a plugin entry's `factory(...)` throws
 *   during plugin-map resolution. Wraps the original exception on
 *   the `cause` field so debugging preserves the underlying stack.
 */

import { ViteConfigError } from "./vite-config.error";

// ════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════

/**
 * Thrown by `resolvePlugins(...)` when a plugin entry's
 * `factory(options)` call throws. The offending plugin's name is
 * embedded in the `message`; the underlying exception is preserved
 * on `cause` so the debugger surfaces the original stack.
 *
 * @example
 * ```typescript
 * try {
 *   await defineConfig({ plugins: { react: reactEntry } })({ mode: 'dev', command: 'serve' });
 * } catch (err) {
 *   if (err instanceof PluginResolutionError) {
 *     console.error(err.code, err.message, err.cause);
 *   }
 * }
 * ```
 */
export class PluginResolutionError extends ViteConfigError {
  /**
   * @param message - Human-readable error description. Should
   *   include the plugin's key so it's clear which entry failed.
   * @param cause - The underlying exception thrown by the plugin
   *   factory. Preserved on the `cause` field for debugging.
   */
  public constructor(message: string, cause?: Error) {
    super(message, cause, "VITE_CONFIG_PLUGIN_RESOLUTION");
    this.name = "PluginResolutionError";

    // Re-anchor the prototype so subclass `instanceof` checks work
    // through downlevel transpilation targets.
    Object.setPrototypeOf(this, PluginResolutionError.prototype);
  }
}
