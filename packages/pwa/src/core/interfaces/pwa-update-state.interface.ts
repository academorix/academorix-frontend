/**
 * @file pwa-update-state.interface.ts
 * @module @stackra/pwa/core/interfaces
 * @description Immutable snapshot of the service-worker update state.
 */

/**
 * Update-prompt snapshot.
 *
 * The service replaces this object identity on every state change; the
 * React hook returns it verbatim so `useSyncExternalStore` can trust
 * referential stability.
 */
export interface IPwaUpdateState {
  /**
   * Whether a waiting service worker is available (either
   * `registration.waiting` is set on first check or `updatefound`
   * fired for a new worker that reached `installed`).
   */
  readonly isAvailable: boolean;

  /**
   * Whether the update banner should be visible. Same as
   * `isAvailable` unless the user explicitly dismissed the banner
   * for the session.
   */
  readonly isVisible: boolean;
}
