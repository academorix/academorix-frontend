/**
 * @file settings.error.ts
 * @module @stackra/settings/core/errors
 * @description Base error class for the settings package. Every
 *   package-specific error extends this so callers can `instanceof`
 *   check a single symbol.
 */

/**
 * Base error class for `@stackra/settings`. Every specific error the
 * package throws extends this class.
 */
export class SettingsError extends Error {
  /**
   * Create a new settings error.
   *
   * @param message - Human-readable description of the failure.
   * @param cause - Optional causal error (e.g. an HTTP failure that
   *   propagated up through the persistence layer).
   */
  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'SettingsError';
    if (cause !== undefined) {
      // Preserve the causal chain — Node / modern browsers understand
      // Error.cause via the standard second-argument form.
      (this as { cause?: unknown }).cause = cause;
    }
  }
}
