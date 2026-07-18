/**
 * @file driver-creator.type.ts
 * @module @stackra/support/types
 * @description Factory-function shape consumed by `Manager.extend(...)`.
 *
 *   A driver creator produces a fresh driver instance. `Manager` calls
 *   it lazily the first time `driver(name)` resolves the associated
 *   driver name; the result is then cached inside the manager.
 */

/**
 * Factory function that creates a driver instance.
 *
 * @typeParam TDriver - The driver interface every produced instance implements.
 */
export type DriverCreator<TDriver> = (config?: unknown) => TDriver;
