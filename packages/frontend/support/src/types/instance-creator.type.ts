/**
 * @file instance-creator.type.ts
 * @module @stackra/support/types
 * @description Factory-function shape consumed by
 *   `MultipleInstanceManager.extend(...)`.
 *
 *   A per-instance creator receives the instance's resolved
 *   configuration and returns a new driver instance. The manager caches
 *   the result by instance name.
 */

/**
 * Factory function that creates a named instance.
 *
 * @typeParam TInstance - The instance interface every driver implements.
 */
export type InstanceCreator<TInstance> = (config: Record<string, unknown>) => TInstance;
