/**
 * @file index.ts
 * @module @stackra/queue
 * @description Public API for the queue package (core entry point).
 *   Multi-driver job queue with processors, workers, and connectors.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { QueueModule } from "./queue.module";

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { QueueManager } from "./services";
export { QueueHandle } from "./services";
export { QueueEventBus } from "./services";
export { Worker, type JobHandler } from "./services";

// ════════════════════════════════════════════════════════════════════════════════
// Connectors
// ════════════════════════════════════════════════════════════════════════════════
export { MemoryConnector } from "./connectors";
export { SyncConnector } from "./connectors";
export { NullConnector } from "./connectors";
export { LocalStorageConnector } from "./connectors";
export { IndexedDBConnector } from "./connectors";
export { BroadcastChannelConnector } from "./connectors";
export { QStashConnector } from "./connectors";

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { Processor } from "./decorators";
export { OnJobEvent } from "./decorators";
export { InjectQueue } from "./decorators";
export { InjectQueueConnection } from "./decorators";

// ════════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════════
export { QueueError } from "./errors";
export { QueueDriverError } from "./errors";
export { MaxAttemptsExceededError } from "./errors";
export { TimeoutExceededError } from "./errors";

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
/** @deprecated Use `registerAs` from `@stackra/config`. Removed in v0.2. */
export { defineConfig } from "./utils";
export { getQueueToken, getQueueConnectionToken } from "./utils";
export { generateJobId, computeBackoff, computeUniqueId } from "./utils";

// ════════════════════════════════════════════════════════════════════════════════
// Deprecation-shim re-export — lets consumers migrating a single
// file `import { registerAs } from '@stackra/queue'` for one release
// cycle without changing the import path. Removed in v0.2; switch
// to `import { registerAs } from '@stackra/config'` at your own
// pace.
// ════════════════════════════════════════════════════════════════════════════════
/** @deprecated Import `registerAs` directly from `@stackra/config`. Removed in v0.2. */
export { registerAs } from "@stackra/config";

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════
export { DEFAULT_QUEUE_CONNECTION } from "./constants";

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════
export type { IQueueConnection } from "./interfaces";
export type { IQueueConnector } from "./interfaces";
export type { IQueueModuleOptions, IQueueConnectionConfig, IWorkerOptions } from "./interfaces";
export type { IJobOptions } from "./interfaces";
export type { IQueuedJob } from "./interfaces";
