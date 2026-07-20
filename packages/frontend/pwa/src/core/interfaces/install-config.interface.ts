/**
 * @file install-config.interface.ts
 * @module @stackra/pwa/core/interfaces
 * @description Configuration shape for the browser install-prompt UX.
 */

/**
 * Install-prompt configuration.
 *
 * Consumed by {@link PwaService} to decide when to surface the
 * in-app install banner after Chrome/Edge fires
 * `beforeinstallprompt`.
 */
export interface IPwaInstallConfig {
  /**
   * Milliseconds to wait after `beforeinstallprompt` before showing
   * the in-app banner. Gives the user time to engage before we ask.
   *
   * @default 30000
   */
  readonly delayMs?: number;

  /**
   * Storage key holding the accumulated dismiss count. When the count
   * reaches {@link maxDismissals} the banner stops appearing.
   *
   * @default 'stackra:pwa:install-dismissed'
   */
  readonly dismissKey?: string;

  /**
   * Maximum number of "Not now" clicks before we stop surfacing the
   * banner for this browser profile.
   *
   * @default 3
   */
  readonly maxDismissals?: number;
}
