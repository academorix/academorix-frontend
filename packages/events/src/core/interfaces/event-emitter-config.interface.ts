/**
 * @file event-emitter-config.interface.ts
 * @module @stackra/events/core/interfaces
 * @description Configuration options for the EventEmitter module.
 *   Passed to `EventEmitterModule.forRoot()` to configure behavior.
 *   All properties are optional — sensible defaults are applied.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Interface
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Full configuration for the event emitter module.
 */
export interface IEventEmitterConfig {
  /**
   * Whether to enable wildcard event matching.
   *
   * @default false
   */
  wildcard?: boolean;

  /**
   * Segment delimiter for wildcard matching.
   *
   * @default '.'
   */
  delimiter?: string;

  /**
   * Maximum number of listeners per event before a memory leak warning.
   * Set to `0` to disable.
   *
   * @default 10
   */
  maxListeners?: number;

  /**
   * Whether to suppress listener errors by default.
   *
   * @default true
   */
  suppressErrors?: boolean;

  /**
   * Default queue name for queued listeners (`@OnEvent({ queued: true })`).
   *
   * @default 'events'
   */
  defaultQueue?: string;
}
