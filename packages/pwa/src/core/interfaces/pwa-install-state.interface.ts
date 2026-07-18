/**
 * @file pwa-install-state.interface.ts
 * @module @stackra/pwa/core/interfaces
 * @description Immutable snapshot of the install prompt state.
 *
 *   Consumed by `useSyncExternalStore` inside `useInstallPrompt` for
 *   tearing-free reads under concurrent React.
 */

/**
 * Install-prompt snapshot.
 *
 * The service replaces this object identity on every state change; the
 * React hook returns it verbatim so `useSyncExternalStore` can trust
 * referential stability.
 */
export interface IPwaInstallState {
  /**
   * Whether the browser has fired `beforeinstallprompt` (Chromium /
   * Edge / Samsung Internet). iOS Safari never fires this — see
   * `useInstallPrompt().isIosSafari`.
   */
  readonly isSupported: boolean;

  /**
   * Whether the in-app install banner should be visible now.
   * `false` while `install.delayMs` is counting down and after the
   * user dismisses or accepts.
   */
  readonly isVisible: boolean;

  /**
   * Whether the app is already installed (running in standalone mode
   * OR the `appinstalled` event has fired this session).
   */
  readonly isInstalled: boolean;

  /**
   * Whether the current browser is iOS Safari — the platform that
   * requires the manual "Share → Add to Home Screen" tutorial.
   */
  readonly isIosSafari: boolean;

  /** Accumulated dismiss count for this browser profile. */
  readonly dismissCount: number;
}
