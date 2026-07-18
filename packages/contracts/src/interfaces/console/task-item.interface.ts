/**
 * @file task-item.interface.ts
 * @module @stackra/contracts/interfaces/console
 * @description Shape of a single entry in the `IConsoleOutput#tasks(...)`
 *   sequential runner — each task carries a title, the async work to run,
 *   and an optional `enabled` gate.
 */

/**
 * A single sequential task. The `task` callback receives an `update`
 * function it may call to change the in-progress spinner label as the
 * work progresses (e.g. "Downloading… 40%").
 */
export interface ITaskItem {
  /** Short title rendered next to the spinner. */
  readonly title: string;

  /**
   * The async work. The callback argument, `update`, replaces the
   * current spinner message with a new one — useful for long tasks
   * that produce sub-steps.
   */
  readonly task: (update: (message: string) => void) => Promise<void>;

  /**
   * Whether this task should run at all. `false` marks it as skipped
   * in the runner's summary output. Defaults to `true` when omitted.
   */
  readonly enabled?: boolean;
}
