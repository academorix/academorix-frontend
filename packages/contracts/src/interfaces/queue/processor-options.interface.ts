/**
 * @file processor-options.interface.ts
 * @module @stackra/contracts/interfaces/queue
 *
 * @description
 * Options accepted by the `@Processor(...)` class decorator — the
 * metadata payload stamped under `PROCESSOR_METADATA_KEY`. Consumers
 * may pass a plain queue name string (normalised into
 * `{ queue }`) or the full options shape.
 */

/**
 * Options for the `@Processor(...)` class decorator.
 *
 * @example
 * ```typescript
 * import { Processor } from '@stackra/decorators/queue';
 *
 * @Processor({ queue: 'email', connection: 'default' })
 * export class EmailProcessor { … }
 *
 * // Or the shorthand form (queue name only):
 * @Processor('email')
 * export class EmailProcessor { … }
 * ```
 */
export interface IProcessorOptions {
  /** Queue name this processor handles. */
  readonly queue: string;
  /** Connection name — defaults to the module default when omitted. */
  readonly connection?: string;
}
