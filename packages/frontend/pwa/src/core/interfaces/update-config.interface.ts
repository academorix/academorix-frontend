/**
 * @file update-config.interface.ts
 * @module @stackra/pwa/core/interfaces
 * @description Configuration shape for service-worker update polling.
 */

/**
 * Service-worker update configuration.
 *
 * Consumed by {@link PwaService} to schedule `registration.update()`
 * polls that surface a waiting worker as an "Update available" event.
 */
export interface IPwaUpdateConfig {
  /**
   * Interval (ms) between `registration.update()` polls. Set to `0`
   * to disable polling entirely (rely on the browser's own update
   * lifecycle).
   *
   * @default 60000
   */
  readonly pollingIntervalMs?: number;
}
