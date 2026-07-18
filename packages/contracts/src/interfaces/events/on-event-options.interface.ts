/**
 * @file on-event-options.interface.ts
 * @module @stackra/contracts/interfaces/events
 *
 * @description
 * Options + accumulated-metadata shape for the `@OnEvent(...)`
 * method decorator. Multiple decorator applications on the same
 * method accumulate into an array of {@link IOnEventMetadata}.
 */

/**
 * Options for a single `@OnEvent(...)` decoration.
 */
export interface IOnEventOptions {
  /**
   * Whether errors thrown by this listener should be suppressed.
   * When `true` (default), listener errors are logged but don't
   * propagate. When `false`, errors bubble up to the emitter.
   *
   * @default true
   */
  readonly suppressErrors?: boolean;

  /**
   * Whether to insert this listener before existing ones (LIFO order).
   *
   * @default false
   */
  readonly prependListener?: boolean;

  /**
   * Whether the listener auto-removes after the first invocation.
   *
   * @default false
   */
  readonly once?: boolean;

  /**
   * Whether to dispatch this listener as a queued background job.
   *
   * When `true`, instead of executing the listener inline, a job is
   * dispatched to `@stackra/queue` with the event payload. The
   * listener executes asynchronously in a worker.
   *
   * Requires `@stackra/queue` as a peer dependency. If the queue
   * system isn't available, falls back to synchronous execution
   * with a warning.
   *
   * @default false
   */
  readonly queued?: boolean;

  /**
   * Queue name to dispatch to when `queued: true`.
   *
   * @default 'events'
   */
  readonly queue?: string;

  /**
   * Delay in milliseconds before the queued job becomes eligible.
   * Only applies when `queued: true`.
   *
   * @default 0
   */
  readonly delay?: number;
}

/**
 * A single stacked `@OnEvent(...)` decoration on a method. Multiple
 * decorations produce an array of these entries under
 * `EVENT_LISTENER_METADATA_KEY`.
 */
export interface IOnEventMetadata {
  /** The event name(s) this listener subscribes to. */
  readonly event: string | symbol | ReadonlyArray<string | symbol>;
  /** Listener options. */
  readonly options?: IOnEventOptions;
}
