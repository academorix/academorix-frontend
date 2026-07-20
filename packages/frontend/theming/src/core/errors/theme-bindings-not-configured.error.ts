/**
 * @file theme-bindings-not-configured.error.ts
 * @module @stackra/theming/errors
 * @description Thrown when a theming hook is called without a platform module loaded.
 */

// ============================================================================
// Error Class
// ============================================================================

/**
 * Thrown when a theming hook is called without a platform module loaded.
 *
 * Provides an actionable message directing the developer to import
 * `WebThemingModule.forRoot()` or `NativeThemingModule.forRoot()`.
 */
export class ThemeBindingsNotConfiguredError extends Error {
  /**
   * @param method - The IThemeBindings method that was called.
   */
  public constructor(method: string) {
    super(
      `[Theming] "${method}" called but no platform adapter is configured. ` +
        `Import WebThemingModule.forRoot() (web) or NativeThemingModule.forRoot() (native) ` +
        `in your root module to register the theme bindings.`,
    );
    this.name = "ThemeBindingsNotConfiguredError";
  }
}
