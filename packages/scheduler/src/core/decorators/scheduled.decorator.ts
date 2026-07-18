/**
 * @file scheduled.decorator.ts
 * @module @stackra/scheduler/core/decorators
 * @description Class decorator that marks a class for auto-registration with the scheduler.
 *   The class must implement a `run()` method returning `Promise<void>`.
 */

import { defineMetadata } from '@vivtel/metadata';
import { SCHEDULED_METADATA_KEY } from '@stackra/contracts';
import type { IScheduledOptions } from '@/core/interfaces/scheduled-options.interface';

/**
 * Mark a class for automatic registration with the scheduler.
 *
 * The decorated class must implement a `run()` method.
 * At bootstrap, discovered `@Scheduled` classes are registered with
 * the configured `ITaskRunner`.
 *
 * @param options - Scheduling configuration
 * @returns A class decorator
 *
 * @example
 * ```typescript
 * @Scheduled({ name: 'sync-orders', every: 60000, retries: 2 })
 * @Injectable()
 * class SyncOrdersTask {
 *   async run(): Promise<void> {
 *     await this.orderService.syncPending();
 *   }
 * }
 * ```
 */
export function Scheduled(options: IScheduledOptions): ClassDecorator {
  return (target: Function) => {
    defineMetadata(SCHEDULED_METADATA_KEY, options, target);
  };
}
