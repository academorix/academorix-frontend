/**
 * @file index.ts
 * @module @stackra/queue/core/interfaces
 * @description Re-exports all interface definitions from this module.
 */

export type { IDefaultJobOptions } from "./default-job-options.interface";
export type { IJobOptions } from "./job-options.interface";
export type { JobEventType } from "./job-event-type.interface";
export type { JobHandler } from "./job-handler.interface";
export type { IProcessorOptions } from "./processor-options.interface";
export type { IQueueConnection } from "./queue-connection.interface";
export type { IQueueConnector } from "./queue-connector.interface";
export type {
  IQueueConnectionConfig,
  IWorkerOptions,
  IQueueModuleOptions,
} from "./queue-module-options.interface";
export type { IQueuedJob } from "./queued-job.interface";
