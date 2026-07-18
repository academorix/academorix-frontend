/**
 * @file use-safe-area-insets.interface.ts
 * @module @stackra/pwa/react/hooks
 * @description Return shape for the safe-area insets hook.
 */

/**
 * Safe-area insets read from CSS `env(safe-area-inset-*)` variables.
 *
 * All values are in pixels; `0` when the environment doesn't expose
 * safe areas (e.g. Chrome desktop, jsdom).
 */
export interface IUseSafeAreaInsetsResult {
  /** Top inset (status bar / notch). */
  readonly top: number;
  /** Right inset (right-edge notch or camera cutout). */
  readonly right: number;
  /** Bottom inset (home indicator / gesture area). */
  readonly bottom: number;
  /** Left inset. */
  readonly left: number;
}
