/**
 * @file scheduled-options.interface.ts
 * @module @stackra/scheduler/src/interfaces
 * @description IScheduledOptions interface.
 */

/**
 * Options for the `@Scheduled()` class decorator.
 */
export interface IScheduledOptions {
  /** Unique name for the scheduled task. */
  readonly name: string;
  /** Execution interval in milliseconds. */
  readonly every: number;
  /** Whether to execute immediately on registration. @default false */
  readonly immediate?: boolean;
  /** Number of retry attempts on failure. @default 0 */
  readonly retries?: number;
}
