/**
 * @file processor.decorator.ts
 * @module @stackra/decorators/queue
 *
 * @description
 * The `@Processor(queueOrOptions)` class decorator — marks a class
 * as a discoverable queue processor. Accepts either a queue-name
 * string (shorthand) or a full options object.
 */

import { PROCESSOR_METADATA_KEY, type IProcessorOptions } from "@stackra/contracts";

import { createDiscoverableClassDecorator, createMetadataReader } from "../core";

/**
 * Mark a class as a discoverable queue processor.
 *
 * @param queueOrOptions Queue name string (shorthand for
 *   `{queue: name}`) or a full `IProcessorOptions` object.
 * @returns A `ClassDecorator` that stamps the options + applies
 *   `@Injectable()`.
 *
 * @example
 * ```typescript
 * import { Processor } from '@stackra/decorators/queue';
 *
 * // Shorthand — queue name only:
 * @Processor('email')
 * export class EmailProcessor { … }
 *
 * // Full options:
 * @Processor({ queue: 'email', connection: 'default' })
 * export class EmailProcessor { … }
 * ```
 */
export const Processor = createProcessorDecorator();

/** Reader for `@Processor(...)` metadata. */
export const processorMetadata = createMetadataReader<IProcessorOptions>(PROCESSOR_METADATA_KEY);

/**
 * Internal — bridges the polymorphic `@Processor(name|options)` signature
 * by normalising a string argument into `{ queue: string }`.
 */
function createProcessorDecorator(): (
  queueOrOptions: string | IProcessorOptions,
) => ClassDecorator {
  const base = createDiscoverableClassDecorator<IProcessorOptions>(PROCESSOR_METADATA_KEY);
  return (queueOrOptions) => {
    const options: IProcessorOptions =
      typeof queueOrOptions === "string" ? { queue: queueOrOptions } : queueOrOptions;
    return base(options);
  };
}
