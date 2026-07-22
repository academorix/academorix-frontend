/**
 * @file index.ts
 * @module @stackra/queue/core/decorators
 * @description Barrel export for queue decorators. `IProcessorOptions`
 *   lives canonically in `@stackra/contracts` — import it from there,
 *   not through this barrel.
 */

export { Processor } from "./processor.decorator";
export { OnJobEvent } from "./on-job-event.decorator";
export { InjectQueue } from "./inject-queue.decorator";
export { InjectQueueConnection } from "./inject-queue-connection.decorator";
