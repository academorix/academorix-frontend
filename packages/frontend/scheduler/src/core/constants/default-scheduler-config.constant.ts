/**
 * @file default-scheduler-config.constant.ts
 * @module @stackra/scheduler/constants
 * @description Default configuration applied to every `SchedulerModule.forRoot()`
 *   registration. Currently empty — add real defaults here when the
 *   module starts taking user options with sensible fallbacks.
 *
 *   Use `mergeSchedulerConfig()` from `../utils` to apply the merge.
 */

/**
 * Default configuration applied to every `SchedulerModule` registration.
 *
 * Empty for now — package author adds real defaults later. Until then,
 * `mergeSchedulerConfig()` is an identity passthrough.
 */
export const DEFAULT_SCHEDULER_CONFIG: Readonly<Record<string, never>> = Object.freeze({});
