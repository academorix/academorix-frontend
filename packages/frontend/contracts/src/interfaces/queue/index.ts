/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/queue
 *
 * @description
 * Barrel for queue subsystem contracts. Options/type shapes for the
 * `@Processor(...)` and `@OnJobEvent(...)` decorators, plus the
 * `JobEventType` union.
 */

export type { JobEventType } from "./job-event-type.type";
export type { IProcessorOptions } from "./processor-options.interface";
export type { IOnJobEventOptions } from "./on-job-event-options.interface";
