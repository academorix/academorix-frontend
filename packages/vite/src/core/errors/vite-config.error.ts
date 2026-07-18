/**
 * @file vite-config.error.ts
 * @module @stackra/vite/core/errors
 * @description Base error class for `@stackra/vite` — every custom
 *   error raised by the package extends {@link ViteConfigError} so
 *   consumers can catch the whole family with one `instanceof`.
 */

// ════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════

/**
 * Base error class for the `@stackra/vite` package.
 *
 * All package-specific errors extend this class so callers can
 * catch every error the package raises with a single
 * `instanceof ViteConfigError` check. The `code` field is stable
 * across message revisions and is safe to switch on
 * programmatically.
 *
 * @example
 * ```typescript
 * try {
 *   await defineConfig({ plugins })({ mode: 'development', command: 'serve' });
 * } catch (err) {
 *   if (err instanceof ViteConfigError) {
 *     console.error(`[${err.code}] ${err.message}`);
 *   }
 * }
 * ```
 */
export class ViteConfigError extends Error {
  /**
   * Machine-readable error code. Overridden by subclasses to
   * discriminate error kinds without message-string matching.
   */
  public readonly code: string;

  /**
   * Underlying error that caused this one, if any. Populated when
   * a plugin factory throws — the original exception is preserved
   * here for debugging without polluting the outer message.
   */
  public readonly cause?: Error;

  /**
   * @param message - Human-readable error description.
   * @param cause - Underlying error that triggered this one, if
   *   applicable.
   * @param code - Machine-readable error code. Defaults to
   *   `'VITE_CONFIG_ERROR'` for the base class; subclasses pass
   *   their own code.
   */
  public constructor(message: string, cause?: Error, code: string = "VITE_CONFIG_ERROR") {
    super(message);
    this.name = "ViteConfigError";
    this.code = code;
    this.cause = cause;

    // Preserve the prototype chain so `instanceof ViteConfigError`
    // keeps working through the transpiled ES5 target used by some
    // consumer toolchains. Without this, subclasses that don't
    // explicitly set their prototype lose the `instanceof` guarantee.
    Object.setPrototypeOf(this, ViteConfigError.prototype);
  }
}
