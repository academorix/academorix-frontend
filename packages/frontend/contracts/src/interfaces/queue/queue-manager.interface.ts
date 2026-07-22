/**
 * @file queue-manager.interface.ts
 * @module @stackra/contracts/interfaces/queue
 * @description Contract shape for a queue manager — the minimal surface
 *   cross-package consumers depend on. The concrete `QueueManager` in
 *   `@stackra/queue` implements this + additional per-connection
 *   methods; a consumer that only needs to fan a job out to a queue
 *   can inject `@Inject(QUEUE_MANAGER)` and type it as `IQueueManager`
 *   without pulling `@stackra/queue` in as a hard dependency.
 *
 *   Promoted to contracts to resolve the DI-reviewer P0-1 finding:
 *   `@stackra/events` was reading `globalThis.__stackra_queue_manager__`
 *   to dispatch queued `@OnEvent` listeners. Dead code because nothing
 *   wrote that slot. The correct wiring is
 *   `@Optional() @Inject(QUEUE_MANAGER) queue?: IQueueManager` — the
 *   contract this interface makes possible.
 *
 *   Kept intentionally small. If a consumer needs
 *   `connection(name)` / `disconnect(name)` / driver introspection,
 *   they inject the concrete `QueueManager` class from `@stackra/queue`.
 */

/**
 * Optional shape for job-dispatch options at the framework contract
 * level. Concrete implementations (see `IJobOptions` in
 * `@stackra/queue`) accept a broader set — this shape is the
 * cross-package minimum every consumer can rely on.
 */
export interface IQueueDispatchOptions {
  /**
   * Named queue / connection the job should land on. When omitted,
   * the concrete manager uses its configured default.
   */
  readonly queue?: string;

  /**
   * Delay in milliseconds before the job becomes visible to the
   * worker. When omitted, the job is enqueued immediately.
   */
  readonly delayMs?: number;
}

/**
 * Minimum contract for a queue manager.
 *
 * Consumers inject the `QUEUE_MANAGER` token and type it as
 * `IQueueManager` when they only need to fan a job out to a queue.
 * Concrete `@stackra/queue` `QueueManager` satisfies this shape
 * structurally and adds per-connection methods on top.
 *
 * @example
 * ```typescript
 * import { QUEUE_MANAGER, type IQueueManager } from '@stackra/contracts';
 * import { Injectable, Inject, Optional } from '@stackra/container';
 *
 * @Injectable()
 * class MyService {
 *   public constructor(
 *     @Optional() @Inject(QUEUE_MANAGER)
 *     private readonly queue?: IQueueManager,
 *   ) {}
 *
 *   public async run(): Promise<void> {
 *     if (this.queue) {
 *       await this.queue.dispatch('my-job', { some: 'payload' });
 *     }
 *   }
 * }
 * ```
 */
export interface IQueueManager {
  /**
   * Enqueue a job on the default connection.
   *
   * @typeParam T - Shape of the job payload.
   * @param name - Job name / handler key.
   * @param data - Job payload the worker receives.
   * @param options - Optional dispatch options (queue name, delay).
   * @returns A promise that resolves to the enqueued job id.
   */
  dispatch<T = unknown>(
    name: string,
    data: T,
    options?: IQueueDispatchOptions,
  ): Promise<string>;
}
