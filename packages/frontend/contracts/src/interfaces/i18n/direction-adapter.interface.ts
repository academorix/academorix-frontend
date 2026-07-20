/**
 * @file direction-adapter.interface.ts
 * @module @stackra/contracts/interfaces/i18n
 * @description Contract for platform-specific text-direction adapters.
 *
 *   Each platform (web, native, SSR) implements this interface. The
 *   `DirectionService` delegates to the adapter registered under the
 *   `I18N_DIRECTION_ADAPTER` token without knowing platform details:
 *
 *   - **Web**: sets `document.documentElement.dir` + `lang`.
 *   - **Native**: calls `I18nManager.forceRTL()` from `react-native`.
 *   - **SSR / Node**: no-op — direction is baked into the HTML response.
 *
 *   Lives in contracts so third-party platform hosts (custom SSR
 *   renderers, embedded webviews) can bind their own adapter without a
 *   runtime dependency on `@stackra/i18n`.
 */

/**
 * Platform-specific direction-adapter contract.
 */
export interface IDirectionAdapter {
  /**
   * Apply a text direction to the platform.
   *
   * @param direction - Target direction (`"ltr"` or `"rtl"`).
   * @param locale - The locale code being applied (used e.g. for the
   *   `lang` attribute on the web).
   * @returns `true` when a restart is required (native only), otherwise
   *   `false`.
   */
  apply(direction: "ltr" | "rtl", locale: string): boolean;

  /**
   * Get the current platform direction.
   *
   * @returns Direction as reported by the underlying platform.
   */
  getCurrentDirection(): "ltr" | "rtl";
}
