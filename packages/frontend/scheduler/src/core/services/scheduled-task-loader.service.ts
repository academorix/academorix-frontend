/**
 * @file scheduled-task-loader.service.ts
 * @module @stackra/scheduler/core/services
 * @description Auto-discovery loader for `@Scheduled()` decorated classes.
 *   Scans all DI providers at bootstrap, finds classes with `@Scheduled`
 *   metadata, validates they have a `run()` method, and registers them
 *   with the SchedulerService.
 */

import { Injectable, Inject, Optional } from '@stackra/container';
import { OnApplicationBootstrap } from '@stackra/contracts';
import { getMetadata } from '@vivtel/metadata';

import { SCHEDULER_SERVICE, SCHEDULED_METADATA_KEY } from '@stackra/contracts';
import { SchedulerService } from './scheduler.service';
import type { IScheduledOptions } from '@/core/interfaces/scheduled-options.interface';
import type { IDiscoveryService } from '@stackra/contracts';
import { DISCOVERY_SERVICE } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Discovery Interface
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Auto-discovers `@Scheduled()` decorated classes and registers them.
 *
 * At module init, scans all providers for `@Scheduled` metadata.
 * Each discovered class must implement a `run(): Promise<void>` method.
 * The loader registers them with the `SchedulerService` using the
 * options from the decorator.
 *
 * @example
 * ```typescript
 * // This class is auto-discovered and registered:
 * @Scheduled({ name: 'sync-orders', every: 60000, retries: 2 })
 * @Injectable()
 * class SyncOrdersTask {
 *   async run(): Promise<void> {
 *     await this.orderService.syncPending();
 *   }
 * }
 * ```
 */
@Injectable()
export class ScheduledTaskLoader implements OnApplicationBootstrap {
  /**
   * @param scheduler - The SchedulerService to register tasks with
   * @param discoveryService - Optional provider scanner
   */
  public constructor(
    @Inject(SCHEDULER_SERVICE) private readonly scheduler: SchedulerService,
    @Optional() @Inject(DISCOVERY_SERVICE) private readonly discoveryService?: IDiscoveryService
  ) {}

  /**
   * Scan all providers for @Scheduled metadata and register them, after
   * every module has initialised. Container-wide discovery must run in
   * `onApplicationBootstrap` so tasks from later-initialised modules aren't
   * missed.
   */
  public onApplicationBootstrap(): void {
    this.loadScheduledTasks();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════════

  /** Discover and register all @Scheduled classes. */
  private loadScheduledTasks(): void {
    if (!this.discoveryService) return;
    const providers = this.discoveryService.getProvidersByMetadata(SCHEDULED_METADATA_KEY);

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance) continue;

      const ctor = (instance as { constructor?: Function }).constructor;
      if (!ctor) continue;

      const options = getMetadata<IScheduledOptions>(SCHEDULED_METADATA_KEY, ctor as object);

      if (!options) continue;

      // Validate the class has a run() method
      const task = instance as { run?: () => Promise<void> };
      if (typeof task.run !== 'function') {
        continue;
      }

      // Register with the scheduler
      this.scheduler.register(options.name, () => task.run!(), {
        interval: options.every,
        immediate: options.immediate,
        retries: options.retries,
      });
    }
  }
}
