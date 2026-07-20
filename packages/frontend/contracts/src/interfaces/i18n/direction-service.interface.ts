/**
 * @file direction-service.interface.ts
 * @module @stackra/contracts/interfaces/i18n
 * @description Public contract of the direction service.
 *
 *   Lives in contracts so UI packages (`@stackra/ui`) and SSR renderers
 *   can consume the RTL/LTR service without a runtime dependency on
 *   `@stackra/i18n`.
 */

/**
 * Direction-service contract — pure detection (`isRtl`, `getDirection`)
 * plus platform delegation via `IDirectionAdapter` for `apply()`.
 */
export interface IDirectionService {
  /** Whether a locale uses right-to-left script. */
  isRtl(locale: string): boolean;

  /** Text direction for a locale. */
  getDirection(locale: string): "ltr" | "rtl";

  /**
   * Apply the direction of a locale via the registered platform adapter.
   *
   * @returns `true` when a restart is required (native), otherwise `false`.
   */
  apply(locale: string): boolean;

  /** Current platform direction as reported by the adapter. */
  getCurrentDirection(): "ltr" | "rtl";
}
