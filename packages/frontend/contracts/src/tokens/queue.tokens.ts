/**
 * @file queue.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens and metadata keys for the queue subsystem.
 *
 *   Tokens live in contracts so cross-package consumers (processor
 *   loaders, dashboards, workers) can reference them without pulling
 *   in the runtime.
 *
 *   NOTE: `QUEUE_CONFIG` used to live here. It was removed in the
 *   `@stackra/config` migration — `QueueModule.forRoot` now binds
 *   the resolved config under a package-internal symbol
 *   (`QUEUE_CONFIG_INTERNAL` in `@stackra/queue`) and consumers who
 *   want to read the same value do so via `@Inject(queueConfig.KEY)`
 *   on an app-owned `registerAs(...)` factory. See
 *   `.kiro/specs/stackra-config-package/PLAN.md` §5.2.
 */

/** Token for the QueueManager singleton. */
export const QUEUE_MANAGER = Symbol.for("QUEUE_MANAGER");

/** Metadata key for the `@Processor()` decorator. */
export const PROCESSOR_METADATA_KEY = "stackra:queue:processor";

/** Metadata key for the `@OnJobEvent()` decorator. */
export const ON_JOB_EVENT_METADATA_KEY = "stackra:queue:on-job-event";
