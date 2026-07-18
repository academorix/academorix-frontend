/**
 * @file lifecycle-entry.interface.ts
 * @module @stackra/container/src/interfaces
 * @description A single lifecycle hook execution log entry.
 */

/**
 * A single lifecycle hook execution entry logged during bootstrap.
 */
export interface ILifecycleEntry {
  /** Provider name. */
  provider?: string;
  /** Hook name (onModuleInit, onApplicationBootstrap). */
  hook?: string;
  /** Duration in milliseconds. */
  durationMs?: number;
  /** Performance.now() timestamp. */
  time?: number;
  /** Whether the hook completed successfully. */
  success?: boolean;
  /** Error thrown by the hook (if any). */
  error?: Error;
  /** Allow additional properties. */
  [key: string]: unknown;
}
