/**
 * @file before-application-shutdown.interface.ts
 * @module @stackra/contracts/interfaces/hooks
 * @description Lifecycle-hook interface — providers that implement it are
 *   invoked by the container just before an application shutdown fires
 *   its terminating signal listeners.
 */

/**
 * Lifecycle hook fired immediately before the container starts
 * tearing down.
 *
 * Called AFTER every request has drained but BEFORE any provider's
 * `onModuleDestroy` runs — giving implementations a chance to react
 * to the incoming signal (e.g. flush metrics, close leases).
 */
export interface BeforeApplicationShutdown {
  /**
   * Runs just before shutdown. May return a promise; the container
   * awaits it before advancing to the destroy phase.
   *
   * @param signal - The OS signal that triggered shutdown, when
   *   available (`SIGTERM`, `SIGINT`, …).
   */
  beforeApplicationShutdown(signal?: string): any;
}
