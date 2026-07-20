/**
 * @file launch-handler.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description Controls how a launched PWA reuses or opens new
 *   windows — the W3C Launch Handler API.
 */

/**
 * One value from the `client_mode` union.
 *
 * - `'auto'` — the user agent picks the mode.
 * - `'focus-existing'` — focus an existing PWA window, don't
 *   navigate.
 * - `'navigate-new'` — always open a new window at the launch URL.
 * - `'navigate-existing'` — reuse an existing window but navigate
 *   it to the launch URL.
 */
export type LaunchHandlerClientMode =
  'auto' | 'focus-existing' | 'navigate-new' | 'navigate-existing';

/**
 * Launch Handler API — declares how the browser should handle the
 * PWA when its start URL is opened while an instance is already
 * running.
 *
 * The `client_mode` field accepts either a single value or an array
 * of preferences the user agent tries in order.
 */
export interface ILaunchHandler {
  /**
   * Preferred client-mode strategy. When an array is supplied, the
   * browser tries each entry until one succeeds.
   */
  readonly client_mode?: LaunchHandlerClientMode | readonly LaunchHandlerClientMode[];
}
