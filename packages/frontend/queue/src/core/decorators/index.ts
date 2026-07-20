/**
 * @file index.ts
 * @module @stackra/queue/core/decorators
 * @description Barrel export for queue decorators. The `IProcessorOptions`
 *   type lives in `../interfaces/` and is imported as a `type` inside the
 *   decorator file; we re-export from the canonical interface module so
 *   consumers have a single import path: `from '@stackra/queue'`.
 */

export { Processor } from "./processor.decorator";
export type { IProcessorOptions } from "@/core/interfaces/processor-options.interface";
export { OnJobEvent } from "./on-job-event.decorator";
export { InjectQueue } from "./inject-queue.decorator";
export { InjectQueueConnection } from "./inject-queue-connection.decorator";
